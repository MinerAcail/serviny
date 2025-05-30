"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Mail,
  MapPin,
  FileText,
  Calendar,
  Search,
  Loader2,
  AlertCircle,
  RefreshCw,
  Download,
  User,
  X,
  Eye,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Info,
} from "lucide-react";
import { gql, useQuery, useMutation } from "@apollo/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Types
interface Rider {
  id: string;
  name: string;
  email: string;
  number: string;
  location?: string;
  experience?: string;
  dpfile?: string;
  idCard?: string[];
  createdAt: string;
  coordinates?: number[];
}

interface RiderRequest {
  id: string;
  riderId: string;
  termsConditions: boolean;
  message?: string;
  serviceId: string;
  state: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
}

interface RiderRequestInfo {
  rider: Rider;
  request: RiderRequest;
}

interface SelectedImage {
  url: string;
  title: string;
  type: "profile" | "document";
}

interface GetAllRidersResponse {
  getAllRidersResponseInfor: RiderRequestInfo[];
}

interface UpdateRiderStateResponse {
  updateStateByServiceProvider: {
    rider: Rider;
    request: RiderRequest;
  };
}

interface UpdateRiderStateVariables {
  riderId: string;
  state: string;
}

const GET_ALL_RIDERS_RESPONSE = gql`
  query getAllRidersResponseInfor {
    getAllRidersResponseInfor {
      rider {
        id
        name
        email
        number
        location
        experience
        dpfile
        idCard
        createdAt
        coordinates
      }
      request {
        id
        riderId
        termsConditions
        message
        serviceId
        state
        createdAt
        updatedAt
      }
    }
  }
`;

const UPDATE_RIDER_STATE = gql`
  mutation updateStateByServiceProvider($riderId: String!, $state: String!) {
    updateStateByServiceProvider(riderId: $riderId, state: $state) {
      rider {
        id
        name
        email
        number
        location
        experience
      }
      request {
        id
        riderId
        state
        updatedAt
      }
    }
  }
`;

export default function RiderRequests() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(
    null
  );
  const [isImageDialogOpen, setIsImageDialogOpen] = useState<boolean>(false);
  const [selectedRider, setSelectedRider] = useState<RiderRequestInfo | null>(
    null
  );
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] =
    useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showStats, setShowStats] = useState<boolean>(false);

  const { data, loading, error, refetch } = useQuery<GetAllRidersResponse>(
    GET_ALL_RIDERS_RESPONSE,
    {
      errorPolicy: "all",
      notifyOnNetworkStatusChange: true,
    }
  );

  const [updateRiderState, { loading: updating }] = useMutation<
    UpdateRiderStateResponse,
    UpdateRiderStateVariables
  >(UPDATE_RIDER_STATE, {
    refetchQueries: [{ query: GET_ALL_RIDERS_RESPONSE }],
    onCompleted: () => {
      console.log("Rider state updated successfully");
    },
    onError: (error) => {
      console.error("Error updating rider state:", error);
    },
  });

  const requests: RiderRequestInfo[] = data?.getAllRidersResponseInfor || [];

  // Filter and search logic
  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      const { rider, request } = item;
      const matchesSearch =
        rider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rider.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || request.state === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, searchTerm, statusFilter]);

  // Calculate statistics
  const stats = useMemo(() => {
    const pending = requests.filter(
      (item) => item.request.state === "pending"
    ).length;
    const approved = requests.filter(
      (item) => item.request.state === "approved"
    ).length;
    const rejected = requests.filter(
      (item) => item.request.state === "rejected"
    ).length;

    // Calculate this week's requests
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeek = requests.filter(
      (item) => new Date(item.request.createdAt) >= weekAgo
    ).length;

    return { pending, approved, rejected, thisWeek };
  }, [requests]);

  const handleStateUpdate = async (riderId: string, newState: string) => {
    try {
      await updateRiderState({
        variables: {
          riderId,
          state: newState,
        },
      });
    } catch (error) {
      console.error("Failed to update rider state:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-orange-50 text-orange-700 border-orange-200 font-medium">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-green-50 text-green-700 border-green-200 font-medium">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200 font-medium">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatPhoneNumber = (number: string) => {
    return number?.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3") || "N/A";
  };

  const handleImageView = (
    imageUrl: string,
    title: string,
    type: "profile" | "document"
  ) => {
    setSelectedImage({ url: imageUrl, title, type });
    setIsImageDialogOpen(true);
  };

  const handleDetailsView = (riderInfo: RiderRequestInfo) => {
    setSelectedRider(riderInfo);
    setIsDetailsDialogOpen(true);
  };

  const handleImageDownload = (imageUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-600 font-medium">
            Loading rider requests...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div>
              <h3 className="font-semibold text-red-800">
                Failed to load rider requests
              </h3>
              <p className="text-red-600 text-sm mt-1">{error.message}</p>
            </div>
          </div>
        </div>
        <Button
          onClick={() => refetch()}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-16  space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <Button
              onClick={() => setShowStats(!showStats)}
              variant="outline"
              className="rounded-xl border-gray-200"
            >
              {showFilters ? (
                <ChevronUp className="mr-2 h-4 w-4" />
              ) : (
                <ChevronDown className="mr-2 h-4 w-4" />
              )}
              Data
            </Button>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="rounded-xl border-gray-200"
            >
              {showFilters ? (
                <ChevronUp className="mr-2 h-4 w-4" />
              ) : (
                <ChevronDown className="mr-2 h-4 w-4" />
              )}
              Filters
            </Button>
            <Button
              onClick={() => refetch()}
              variant="outline"
              disabled={loading}
              className="rounded-xl border-gray-200"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      {showFilters && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, or request ID..."
              className="pl-11 rounded-xl border-gray-200 h-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {["all", "pending", "approved", "rejected"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className={`capitalize rounded-xl ${
                  statusFilter === status
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                {status === "all" ? "All Requests" : status}
                {status !== "all" && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-white/20 rounded-md">
                    {status === "pending" && stats.pending}
                    {status === "approved" && stats.approved}
                    {status === "rejected" && stats.rejected}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {showStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {stats.pending}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {stats.approved}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {stats.rejected}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {stats.thisWeek}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Requests Grid */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No requests found
          </h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== "all"
              ? "Try adjusting your search criteria"
              : "No rider requests have been submitted yet"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {filteredRequests.map(({ rider, request }) => (
            <div
              onClick={() => handleDetailsView({ rider, request })}
              key={request.id}
              className="bg-white rounded-2xl p-6 cursor-pointer shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar
                      className="w-12 h-12 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() =>
                        rider.dpfile &&
                        handleImageView(
                          rider.dpfile,
                          `${rider.name}'s Profile Picture`,
                          "profile"
                        )
                      }
                    >
                      <AvatarImage
                        src={
                          rider.dpfile || "/placeholder.svg?height=48&width=48"
                        }
                      />
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                        {rider.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    {rider.dpfile && (
                      <button
                        className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                        onClick={() =>
                          handleImageView(
                            rider.dpfile!,
                            `${rider.name}'s Profile Picture`,
                            "profile"
                          )
                        }
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {rider.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {formatDate(request.createdAt)}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-lg"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem
                      onClick={() => handleDetailsView({ rider, request })}
                    >
                      <Info className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    {rider.dpfile && (
                      <DropdownMenuItem
                        onClick={() =>
                          handleImageView(
                            rider.dpfile!,
                            `${rider.name}'s Profile`,
                            "profile"
                          )
                        }
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Profile Photo
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Status */}
              <div className="mb-4">{getStatusBadge(request.state)}</div>

              {/* Quick Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span className="truncate">{rider.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{formatPhoneNumber(rider.number)}</span>
                </div>
                {rider.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{rider.location}</span>
                  </div>
                )}
              </div>

              {/* Documents indicator */}
              {rider.idCard && rider.idCard.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <FileText className="h-4 w-4" />
                  <span>
                    {rider.idCard.length} document
                    {rider.idCard.length > 1 ? "s" : ""} uploaded
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2">
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    className="flex-1 rounded-xl bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => {
                      handleStateUpdate(selectedRider!.rider.id, "approved");
                      setIsDetailsDialogOpen(false);
                    }}
                    disabled={updating}
                  >
                    {updating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => {
                      handleStateUpdate(selectedRider!.rider.id, "rejected");
                      setIsDetailsDialogOpen(false);
                    }}
                    disabled={updating}
                  >
                    {updating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Reject
                  </Button>
                </div>
               
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="max-w-4xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {selectedImage?.title}
              <div className="flex gap-2">
                {selectedImage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleImageDownload(
                        selectedImage.url,
                        selectedImage.title
                      )
                    }
                    className="rounded-xl"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsImageDialogOpen(false)}
                  className="rounded-xl"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="flex justify-center">
              <img
                src={selectedImage.url || "/placeholder.svg"}
                alt={selectedImage.title}
                className="max-w-full max-h-[70vh] object-contain rounded-xl"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Rider Details
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDetailsDialogOpen(false)}
                className="rounded-xl"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedRider && (
            <div className="space-y-6">
              {/* Profile Section */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <Avatar
                  className="w-16 h-16 cursor-pointer"
                  onClick={() =>
                    selectedRider.rider.dpfile &&
                    handleImageView(
                      selectedRider.rider.dpfile,
                      `${selectedRider.rider.name}'s Profile Picture`,
                      "profile"
                    )
                  }
                >
                  <AvatarImage
                    src={
                      selectedRider.rider.dpfile ||
                      "/placeholder.svg?height=64&width=64"
                    }
                  />
                  <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-lg">
                    {selectedRider.rider.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedRider.rider.name}
                  </h3>
                  <p className="text-gray-600">
                    Request ID: {selectedRider.request.id}
                  </p>
                  <div className="mt-2">
                    {getStatusBadge(selectedRider.request.state)}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">
                  Contact Information
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <span>{selectedRider.rider.email}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Phone className="h-5 w-5 text-gray-500" />
                    <span>{formatPhoneNumber(selectedRider.rider.number)}</span>
                  </div>
                  {selectedRider.rider.location && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <MapPin className="h-5 w-5 text-gray-500" />
                      <span>{selectedRider.rider.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Experience */}
              {selectedRider.rider.experience && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Experience</h4>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-gray-700">
                      {selectedRider.rider.experience}
                    </p>
                  </div>
                </div>
              )}

              {/* Message */}
              {selectedRider.request.message && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Message</h4>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-gray-700">
                      {selectedRider.request.message}
                    </p>
                  </div>
                </div>
              )}

              {/* Documents */}
              {selectedRider.rider.idCard &&
                selectedRider.rider.idCard.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">
                      ID Documents
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedRider.rider.idCard.map((doc, index) => (
                        <div
                          key={index}
                          className="relative group cursor-pointer"
                          onClick={() =>
                            handleImageView(
                              doc,
                              `ID Document ${index + 1}`,
                              "document"
                            )
                          }
                        >
                          <div className="aspect-video bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-blue-400 transition-colors">
                            <div className="text-center">
                              <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <span className="text-sm text-gray-600">
                                ID Document {index + 1}
                              </span>
                            </div>
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center">
                              <Eye className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Terms & Dates */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">
                  Additional Information
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Terms & Conditions Accepted</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Submitted: {formatDate(selectedRider.request.createdAt)}
                    </span>
                  </div>
                  {selectedRider.request.updatedAt !==
                    selectedRider.request.createdAt && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>
                        Last updated:{" "}
                        {formatDate(selectedRider.request.updatedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {(selectedRider.request.state === "pending" ||
                selectedRider.request.state === "rejected") && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    className="flex-1 rounded-xl bg-green-500 hover:bg-green-600 text-white"
                    onClick={() => {
                      handleStateUpdate(selectedRider.rider.id, "approved");
                      setIsDetailsDialogOpen(false);
                    }}
                    disabled={updating}
                  >
                    {updating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => {
                      handleStateUpdate(selectedRider.rider.id, "rejected");
                      setIsDetailsDialogOpen(false);
                    }}
                    disabled={updating}
                  >
                    {updating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

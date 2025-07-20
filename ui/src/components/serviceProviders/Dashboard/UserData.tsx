import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Mail,
  // Phone,
  // Star,
  UserRound,
  // Clock,
  // FileText,
  // Loader2,
  AlertCircle,
  BookOpen,
  NotepadText,
  // Calendar,
  Search,
  Filter,
  Download,
  Eye,
  Clock,
  Phone,
  Star,
  Loader2,
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  User,
  Package,
  TrendingUp,
  BarChart3,
  DollarSign,
  CheckCircle,
  Building,
} from "lucide-react";

import { useLocation, useParams } from "react-router";
import { useQuery } from "@apollo/client";
import { DeliveryServiceSystem } from "../APPOINTMENT/DeliveryServiceBooking/DeliveryServiceSystem";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/middleware/context/authContext";
import {
  getPaymentStatusColor,
  getPaymentMethodIcon,
  processServiceData,
  generateSearchSuggestions,
  filterServices,
  calculateStats,
  getUniquePaymentStatuses,
} from "@/components/rider/history/rider-history-utils";
import { Badge } from "@/components/ui/badge";
import BookingShareDialog from "./booking-share-dialog";
import {
  GET_ALL_APPOINTMENT_BOOKINGS_BY_USER_ID,
  type ServiceData,
  type ViewMode,
} from "./gql";
import BackButton from "@/components/back";

export default function ContactDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const location = useLocation();
  // const user = useAuth();
  // To get query parameter (?share=...)
  const queryParams = new URLSearchParams(location.search);
  const entityID = queryParams.get("share");
  console.log("shareBoojk", entityID);

  const { user } = useAuth();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [open, onClose] = useState(true);
  // const [openClick, onCloseClick] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(
    null
  );

  const serviceId = user?.id;
  const [searchQuery, setSearchQuery] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { loading, error, data, refetch } = useQuery(
    GET_ALL_APPOINTMENT_BOOKINGS_BY_USER_ID,
    {
      pollInterval: 30000,
      errorPolicy: "all",
      notifyOnNetworkStatusChange: true,
      fetchPolicy: "cache-and-network",
      variables: { userId },
    }
  );


  const contactData = data?.getAllServiceDataByUserId[0];

  const userData = contactData?.customer;
  const serviceData = user?.name;

  // Process the service data for history display with payment information and grouping
  const { historyData, groupedData, standaloneServices } = useMemo(() => {
    if (!data?.getAllServiceDataByUserId)
      return {
        historyData: [],
        groupedData: new Map(),
        standaloneServices: [],
      };

    return processServiceData(data?.getAllServiceDataByUserId);
  }, [data]);

  // Enhanced filter with support for multi-group search and filtering
  const { filteredHistory,  filteredStandalone } =
    useMemo(() => {
      return filterServices(
        historyData,
        standaloneServices,
        groupedData,
        searchQuery,
        typeFilter,
        statusFilter,
        paymentStatusFilter
      );
    }, [
      historyData,
      searchQuery,
      typeFilter,
      statusFilter,
      paymentStatusFilter,
      standaloneServices,
      groupedData,
    ]);




  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "DELIVERED":
      case "CONFIRMED":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
            Delivered
          </Badge>
        );
      case "CANCELLED":
      case "CANCELED":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
            Cancelled
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 text-xs">
            Pending
          </Badge>
        );
      case "PREPARING":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
            Preparing
          </Badge>
        );
      case "OUT_FOR_DELIVERY":
        return (
          <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
            Delivering
          </Badge>
        );
      case "REFUNDED":
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200 text-xs">
            Refunded
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="text-xs">
            {status || "Unknown"}
          </Badge>
        );
    }
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    if (!paymentStatus) return null;

    return (
      <Badge className={`text-xs ${getPaymentStatusColor(paymentStatus)}`}>
        {paymentStatus}
      </Badge>
    );
  };

  // Loading state
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Loading History
          </h3>
          <p className="text-gray-600">Fetching service data?...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-md mx-auto">
          <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Unable to Load History
          </h3>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <Button onClick={() => refetch()} className="rounded-xl">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className=" py-14 px-4 w-full">
      {/* <div className="pb-6">
        <MainNaveBar />
      </div> */}
      {entityID && (
        <BookingShareDialog
          userId={userId ?? ""}
          entityID={entityID}
          open={open}
          onClose={() => onClose(!open)}
          serviceProvider={serviceData}
        />
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {filteredHistory.length !== 0 && (
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1.5">
                  <CardTitle>{userData?.name}</CardTitle>
                  <CardDescription>{userData?.type}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{userData?.number}</span>
                  {userData?.numberType && (
                    <span className="text-xs text-muted-foreground">
                      ({userData?.numberType})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span>{filteredStandalone.length}</span>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex w-full gap-2">
                  <Button
                    className="flex-1"
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <a href={`tel:${userData?.number}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      Call
                    </a>
                  </Button>

                  {userId && (
                    <Button
                      onClick={() => setDialogOpen(true)}
                      variant="secondary"
                      className="gap-2 rounded-full bg-secondary hover:bg-secondary/90 w-full"
                    >
                      <NotepadText className="h-4 w-4" />
                      Book Me
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          </div>
        )}

        <div className="md:col-span-2">
          <div className="space-y-4">
          

            {/* Individual Services Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {filteredStandalone.map((order: ServiceData) => (
                      <Card
                        key={order.serviceId}
                        className="border-0 shadow-sm bg-white rounded-xl"
                      >
                        <CardContent className="p-4">
                          {/* Header Row */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm text-gray-900 truncate">
                                  {order.type} #
                                  {order.id?.slice(-6) ||
                                    order.serviceId.slice(-6)}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {order.type === "ORDER" ? "Order" : "Booking"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {order.date} • {order.time}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {getStatusBadge(order.status)}
                              <span className="text-sm font-semibold text-gray-900">
                                {order.orderValue}
                              </span>
                            </div>
                          </div>

                          {/* Payment Information Row */}
                          {(order.paymentMethod || order.paymentStatus) && (
                            <div className="bg-gray-50/50 rounded-lg p-2 mb-3">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1">
                                  <span className="text-lg">
                                    {getPaymentMethodIcon(
                                      order.paymentMethod || ""
                                    )}
                                  </span>
                                  <span className="text-gray-600">
                                    Payment:
                                  </span>
                                  <span className="font-medium text-gray-900">
                                    {order.paymentMethod || "Unknown"}
                                  </span>
                                </div>
                                {order.paymentStatus &&
                                  getPaymentStatusBadge(order.paymentStatus)}
                              </div>
                            </div>
                          )}

                          {/* Customer & Vendor Row */}
                          <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                <User className="h-3 w-3 text-gray-400" />
                                <span className="font-medium text-gray-700">
                                  Customer
                                </span>
                              </div>
                              <p className="text-gray-900 truncate">
                                {order.customer}
                              </p>
                            </div>
                            <div>
                              <div className="flex items-center gap-1 mb-1">
                                <Building className="h-3 w-3 text-gray-400" />
                                <span className="font-medium text-gray-700">
                                  {order.type === "ORDER" ? "Vendor" : "Venue"}
                                </span>
                              </div>
                              <p className="text-gray-900 truncate">
                                {order.vendor}
                              </p>
                            </div>
                          </div>

                          {/* Booking specific information */}
                          {order.type === "BOOKING" &&
                            (order.tableSize || order.bookingDay) && (
                              <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                                {order.tableSize && (
                                  <div>
                                    <span className="text-gray-900">
                                      {order.tableSize} Items
                                    </span>
                                  </div>
                                )}
                                {order.bookingDay && (
                                  <div>
                                    <span className="font-medium text-gray-700">
                                      Day:{" "}
                                    </span>
                                    <span className="text-gray-900">
                                      {order.bookingDay}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                          {/* Booking Description */}
                          {order.type === "BOOKING" &&
                            (order.item || order.notes) && <></>}

                          <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                            <div>
                              <span className="font-medium text-gray-700">
                                Rider:{" "}
                              </span>
                              <span className="text-gray-900">
                                {order.rider}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">
                                Distance:{" "}
                              </span>
                              <span className="text-gray-900">
                                {order.distance}
                              </span>
                            </div>
                          </div>

                          {/* Action Button */}
                          <Dialog>
                            <div className="flex gap-3">
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full rounded-lg"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Detailsd
                                </Button>
                              </DialogTrigger>
                              {userId && (
                                <Button
                                  onClick={() => {
                                    // Use the appropriate ID based on booking type
                                    const bookingEntityId =
                                      order.type === "BOOKING"
                                        ? order.rawData?.bookingData?.bookingId
                                        : order.rawData?.orderData?.orderId;

                                    console.log(
                                      "Setting booking ID:",
                                      bookingEntityId
                                    );
                                    console.log("Order data:", order);

                                    setSelectedBookingId(
                                      bookingEntityId || order.serviceId
                                    );
                                  }}
                                  variant="secondary"
                                  className="gap-2 rounded-full bg-secondary hover:bg-secondary/90 w-full"
                                >
                                  <Mail className="h-4 w-4" />
                                  Message
                                </Button>
                              )}
                            </div>
                            <DialogContent className="sm:max-w-lg mx-2 sm:mx-4 max-h-[90vh] overflow-hidden">
                              <DialogHeader>
                                <DialogTitle className="text-lg">
                                  {order.type} #
                                  {order.id?.slice(-6) ||
                                    order.serviceId.slice(-6)}
                                </DialogTitle>
                                <DialogDescription>
                                  Complete service information
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                                {/* Service Overview */}
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      Date & Time
                                    </p>
                                    <p className="text-gray-600">
                                      {order.date} at {order.time}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      Service Value
                                    </p>
                                    <p className="text-gray-600">
                                      {order.orderValue}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      Duration
                                    </p>
                                    <p className="text-gray-600">
                                      {order.deliveryTime}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      Distance
                                    </p>
                                    <p className="text-gray-600">
                                      {order.distance}
                                    </p>
                                  </div>
                                </div>

                                {/* Customer Info */}
                                <div className="bg-blue-50 rounded-lg p-3">
                                  <p className="font-medium text-gray-900 mb-2">
                                    Customer Information
                                  </p>
                                  <p className="text-sm text-gray-900">
                                    {order.customer}
                                  </p>
                                  <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                                    <Phone className="h-3 w-3" />
                                    {order.customerPhone}
                                  </div>
                                </div>

                                {/* Vendor/Venue Info */}
                                <div className="bg-green-50 rounded-lg p-3">
                                  <p className="font-medium text-gray-900 mb-2">
                                    {order.type === "ORDER"
                                      ? "Vendor"
                                      : "Venue"}{" "}
                                    Information
                                  </p>
                                  <p className="text-sm text-gray-900">
                                    {order.vendor}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {order.vendorLocation}
                                  </p>
                                </div>

                                {/* Rider Info */}
                                <div className="bg-purple-50 rounded-lg p-3">
                                  <p className="font-medium text-gray-900 mb-2">
                                    Rider Information
                                  </p>
                                  <p className="text-sm text-gray-900">
                                    {order.rider}
                                  </p>
                                  {order.riderPhone !== "-" && (
                                    <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                                      <Phone className="h-3 w-3" />
                                      {order.riderPhone}
                                    </div>
                                  )}
                                </div>

                                {/* Booking Description (for bookings only) */}
                                {order.type === "BOOKING" &&
                                  (order.item || order.notes) && (
                                    <div className="bg-amber-50 rounded-lg p-3">
                                      <p className="font-medium text-gray-900 mb-2">
                                        Booking Description
                                      </p>
                                      {order.item && (
                                        <div className="mb-2">
                                          <span className="text-sm font-medium text-gray-700">
                                            Item:{" "}
                                          </span>
                                          <span className="text-sm text-gray-900">
                                            {order.item}
                                          </span>
                                        </div>
                                      )}
                                      {order.notes && (
                                        <div>
                                          <span className="text-sm font-medium text-gray-700">
                                            Note:{" "}
                                          </span>
                                          <span className="text-sm text-gray-900">
                                            {order.notes}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                {/* Route Information */}
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <p className="font-medium text-gray-900 mb-2">
                                    Route
                                  </p>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span className="text-sm text-gray-600">
                                        From: {order.pickup}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                      <span className="text-sm text-gray-600">
                                        To: {order.delivery}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Status & Rating */}
                                <div className="flex items-center justify-between pt-2 border-t">
                                  <div className="flex gap-2">
                                    {getStatusBadge(order.status)}
                                  </div>
                                  {order.rating && (
                                    <div className="flex items-center gap-1">
                                      <Star className="h-4 w-4 text-yellow-500" />
                                      <span className="text-sm font-medium">
                                        {order.rating}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

            {/* No Results State */}
            {filteredHistory.length === 0 && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  No Results Found
                  <BackButton />
                </h4>
                <p className="text-gray-500 text-sm px-4">
                  {searchQuery
                    ? "Try adjusting your search terms or clearing the search."
                    : "No service history available at the moment."}
                </p>
                {searchQuery && (
                  <Button
                    variant="outline"
                    onClick={() => setSearchQuery("")}
                    className="mt-4 rounded-xl"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
        <DeliveryServiceSystem
          isDialogOpenMain={isDialogOpen}
          setDialogOpenMain={setDialogOpen}
          serviceId={serviceId}
          isService={true}
          userDataId={userId}
        />
        {selectedBookingId && (
          <BookingShareDialog
            userId={userId ?? ""}
            entityID={selectedBookingId}
            open={!!selectedBookingId}
            onClose={() => setSelectedBookingId(null)}
            serviceProvider={serviceData}
          />
        )}
      </div>
    </div>
  );
}

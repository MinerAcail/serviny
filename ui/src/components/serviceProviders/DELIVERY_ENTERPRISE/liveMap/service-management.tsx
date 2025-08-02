import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  // DropdownMenuSeparator,
  // DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Package,
  Calendar,
  Users,
  Search,
  Filter,
  Eye,
  MoreVertical,
  Navigation,
  Clock,
  MapPin,
  DollarSign,
  Phone,
  Building,
  Link,
  ChevronRight,
  BarChart3,
  MapIcon as LiveMap,
  X,
  RecycleIcon,
  Trash2,
} from "lucide-react";

// Type definitions (keeping all the original interfaces)
interface Customer {
  name: string;
  number: string;
  dpfile?: string;
}

interface Vendor {
  id: string;
  name: string;
  location: string;
  coordinates?: string;
}

interface Rider {
  id: string;
  name: string;
  number: string;
  location: string;
  coordinates?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  state: string;
}

interface ProductInfo {
  product: Product;
  quantity: number;
}

interface DeliveryMetaData {
  id: string;
  price: number;
  duration: number;
  distance: number;
  zone: string;
  geojson?: string;
  isochroneId?: string;
}

interface RouteData {
  id: string;
  orderId: string;
  geojson: string;
  userId: string;
  createdAt: string;
}

interface OrderItem {
  id: string;
  orderId: string;
  quantity: number;
  itemType: string;
  product: Product;
}

interface Order {
  id: string;
  coordinates: string;
  deliveryAddress: string;
  distance: number;
  duration: number;
  items: OrderItem[];
}

interface OrderData {
  orderData?: {
    orderId?: string;
    status?: string; // Using status field for orders
    deliveryAddress?: string;
    estimatedDeliveryDate?: string;
    serviceFee?: number;
    productInfor?: Array<{
      product: Product[];
      quantity: number;
    }>;
    deliveryMetaData?: {
      id: string;
      price: number;
      duration: string;
      distance: string;
      zone: string;
      geojson: any;
      isochroneId: string;
    };
    routeData?: {
      id: string;
      orderId: string;
      geojson: any;
      userId: string;
      createdAt: string;
    };
    order?: {
      id: string;
      coordinates: [number, number];
      deliveryAddress: string;
      distance: string;
      duration: string;
      items: Array<{
        id: string;
        orderId: string;
        quantity: number;
        itemType: string;
        product: {
          id: string;
          name: string;
        };
      }>;
    };
  };
}

interface RangeMetaData {
  id: string;
  riderId: string;
  startKm: number;
  endKm: number;
  price: number;
}

interface BookingData {
  bookingId: string;
  startTime?: string;
  endTime?: string;
  day: string;
  item?: string;
  tableSize: number;
  userType?: string;
  isConfirmed: boolean;
  pickupLocation?: string;
  dropoffLocation?: string;
  deliveryAddress?: string;
  pickUpAddress?: string;
  multiGroupId?: string;
  deliveryFee: string;
  distance?: number;
  duration?: number;
  estimatedDeliveryDate?: string;
  rangeMetaData?: RangeMetaData;
  routeData?: RouteData;
}

interface ServiceItem {
  id: string;
  serviceId: string;
  type: "ORDER" | "BOOKING";
  createdAt: string;
  customer: Customer;
  vendor: Vendor;
  rider?: Rider;
  orderData?: OrderData;
  bookingData?: BookingData;
}

interface ProcessedCustomer {
  name: string;
  phone: string;
  totalServices: number;
  orders: number;
  bookings: number;
  totalSpent: number;
  services: ServiceItem[];
  multiGroups: string[];
}

interface ProcessedVendor {
  name: string;
  location: string;
  totalServices: number;
  orders: number;
  bookings: number;
  totalRevenue: number;
  services: ServiceItem[];
  customers: number;
}

interface MultiGroup {
  id: string;
  shortId: string;
  services: ServiceItem[];
  totalBookings: number;
  uniqueCustomers: string[];
  uniqueVendors: string[];
  uniqueRiders: string[];
  totalFee: number;
  confirmedBookings: number;
  pendingBookings: number;
  status: string;
  createdAt: string;
  mainCustomer: Customer;
  mainVendor: Vendor;
  mainRider?: Rider;
}

interface ServiceManagementProps {
  serviceData: ServiceData[];
  riders: Rider[];
  stats: any;
  onRiderClick: (rider: Rider) => void;
  setShowOrdersBookings: (show: boolean) => void;
  onViewOnLiveMap?: (
    entityId: string,
    entityType: "order" | "booking" | "multigroup" | "customer" | "vendor"
  ) => void;
}

// Responsive Badge component
const Badge: React.FC<{
  children: React.ReactNode;
  className?: string;
  variant?: string;
}> = ({ children, className = "", variant = "default" }) => {
  const baseStyles =
    "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium";
  const variantStyles =
    variant === "outline"
      ? "border border-gray-300 text-gray-700 bg-white"
      : "bg-gray-100 text-gray-800";

  return (
    <span className={`${baseStyles} ${variantStyles} ${className}`}>
      {children}
    </span>
  );
};

// Responsive Card components
const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}> = ({ children, className = "", ...props }) => (
  <div
    className={`bg-white/10 backdrop-blur-3xl border border-white/20 rounded-2xl shadow-xl ${className}`}
    {...props}
  >
    {children}
  </div>
);

const CardHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}> = ({ children, className = "", ...props }) => (
  <div className={`p-4 sm:p-6 pb-2 ${className}`} {...props}>
    {children}
  </div>
);

const CardTitle: React.FC<{
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}> = ({ children, className = "", ...props }) => (
  <h3
    className={`text-lg sm:text-xl font-bold text-black tracking-tight ${className}`}
    {...props}
  >
    {children}
  </h3>
);

const CardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}> = ({ children, className = "", ...props }) => (
  <div className={`p-4 sm:p-6 pt-2 ${className}`} {...props}>
    {children}
  </div>
);

// Responsive Tabs components
const Tabs: React.FC<{
  children: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}> = ({ children, value, onValueChange, className = "" }) => (
  <div className={`w-full h-full flex flex-col ${className}`}>
    {React.Children.map(children, (child) =>
      React.isValidElement(child)
        ? React.cloneElement(child, {
            activeTab: value,
            onTabChange: onValueChange,
          })
        : child
    )}
  </div>
);

const TabsList: React.FC<{
  children: React.ReactNode;
  className?: string;
  activeTab?: string;
  onTabChange?: (value: string) => void;
}> = ({ children, className = "", activeTab, onTabChange }) => (
  <div
    className={`flex overflow-x-auto border-b border-white/20 bg-white/5 backdrop-blur-xl scrollbar-hide ${className}`}
  >
    {React.Children.map(children, (child) =>
      React.isValidElement(child)
        ? React.cloneElement(child, { activeTab, onTabChange })
        : child
    )}
  </div>
);

const TabsTrigger: React.FC<{
  children: React.ReactNode;
  value: string;
  className?: string;
  activeTab?: string;
  onTabChange?: (value: string) => void;
}> = ({ children, value, className = "", activeTab, onTabChange }) => {
  const isActive = activeTab === value;
  return (
    <button
      onClick={() => onTabChange?.(value)}
      className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all duration-300 flex-shrink-0 whitespace-nowrap ${
        isActive
          ? "border-black text-black bg-white/20"
          : "border-transparent text-black/60 hover:text-black hover:border-black/30 hover:bg-white/10"
      } ${className}`}
    >
      {children}
    </button>
  );
};

const TabsContent: React.FC<{
  children: React.ReactNode;
  value: string;
  className?: string;
  activeTab?: string;
}> = ({ children, value, className = "", activeTab }) => {
  if (activeTab !== value) return null;
  return (
    <div className={`flex-1 overflow-hidden ${className}`}>{children}</div>
  );
};
import cargo from "../../../../assets/cargo.png";
import { PaymentStatusSectionAssigned } from "./invoice/indesx";
import ReAssignRiderDialog from "./reAssign";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { gql, useMutation } from "@apollo/client";
import { NotificationAlertDialog } from "@/components/GlobalLogic/ErrorBoundary";
import {
  CartItemOrder,
  productInfor,
  ServiceData,
} from "./serviceDataAndTypes";
import { formatPrice } from "@/components/global/formatPrice";
// DELETE_BOOKING_MUTATION
const DELETE_BOOKING_MUTATION = gql`
  mutation DeleteBookingOrOrder($entityId: String!, $entityType: String!) {
    deleteBookingOrOrder(entityId: $entityId, entityType: $entityType) {
      success
      message
    }
  }
`;
export const ServiceManagement: React.FC<ServiceManagementProps> = ({
  serviceData,
  riders,
  stats,
  onRiderClick,
  onViewOnLiveMap,
  setShowOrdersBookings,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("analytics");
  // const [statusFilter, setStatusFilter] = useState("all");
  // const [typeFilter, setTypeFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState<ServiceData>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedMultiGroup, setSelectedMultiGroup] =
    useState<MultiGroup | null>(null);
  const [showMultiGroupBookings, setShowMultiGroupBookings] = useState(false);
  // deleteBookingOrOrder mutation
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    type: "success" | "error" | "warning" | "info";
    onConfirm?: () => void;
  } | null>(null);

  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const [deleteBookingOrOrder] = useMutation(DELETE_BOOKING_MUTATION, {
    onCompleted: (data) => {
      setIsDeleting(null);
      if (data?.deleteBookingOrOrder?.success) {
        setDialogState({
          isOpen: true,
          title: "Success",
          description:
            data.deleteBookingOrOrder.message || "Item deleted successfully",
          type: "success",
        });
      } else {
        setDialogState({
          isOpen: true,
          title: "Error",
          description:
            data?.deleteBookingOrOrder?.message || "Failed to delete item",
          type: "error",
        });
      }
    },
    onError: (error) => {
      setIsDeleting(null);
      let errorMessage = "An unexpected error occurred";
      if (error.graphQLErrors?.length > 0) {
        errorMessage = error.graphQLErrors[0].message;
      } else if (error.networkError) {
        errorMessage = "Network error. Please check your connection.";
      }

      setDialogState({
        isOpen: true,
        title: "Delete Failed",
        description: errorMessage,
        type: "error",
      });
    },
  });

  const handleDeleteBooking = async (entityId: string, entityType: string) => {
    if (!entityId) {
      setDialogState({
        isOpen: true,
        title: "Error",
        description: "Invalid item ID",
        type: "error",
      });
      return;
    }

    setDialogState({
      isOpen: true,
      title: "Are you sure?",
      description: "This action cannot be undone.",
      type: "warning",
      onConfirm: () => handleConfirmedDelete(entityId, entityType),
    });
  };

  const handleConfirmedDelete = async (
    entityId: string,
    entityType: string
  ) => {
    setIsDeleting(entityId);
    try {
      await deleteBookingOrOrder({
        variables: {
          entityId,
          entityType: entityType.toUpperCase(),
        },
      });
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const closeDialog = () => {
    setDialogState(null);
  };

  // Enhanced data processing with MultiGroup support (keeping original logic)
  const processedData = useMemo(() => {
    const orders = serviceData.filter((s) => s.type === "ORDER");
    const bookings = serviceData.filter((s) => s.type === "BOOKING");

    const multiGroupMap = new Map<string, ServiceItem[]>();
    bookings.forEach((booking) => {
      if (booking.bookingData?.multiGroupId) {
        const mgId = booking.bookingData.multiGroupId;
        if (!multiGroupMap.has(mgId)) {
          multiGroupMap.set(mgId, []);
        }
        multiGroupMap.get(mgId)!.push(booking);
      }
    });

    const multiGroups: MultiGroup[] = Array.from(multiGroupMap.entries()).map(
      ([multiGroupId, services]) => {
        const uniqueCustomers = [
          ...new Set(services.map((s) => s.customer.name)),
        ];
        const uniqueVendors = [...new Set(services.map((s) => s.vendor.name))];
        const uniqueRiders = [
          ...new Set(services.filter((s) => s.rider).map((s) => s.rider!.name)),
        ];

        const totalFee = services.reduce(
          (sum, s) =>
            sum + Number.parseFloat(s.bookingData?.deliveryFee || "0"),
          0
        );
        const confirmedBookings = services.filter(
          (s) => s.bookingData?.isConfirmed
        ).length;
        const pendingBookings = services.length - confirmedBookings;

        return {
          id: multiGroupId,
          shortId: multiGroupId.slice(-6),
          services: services,
          totalBookings: services.length,
          uniqueCustomers,
          uniqueVendors,
          uniqueRiders,
          totalFee,
          confirmedBookings,
          pendingBookings,
          status:
            confirmedBookings === services.length
              ? "All Confirmed"
              : confirmedBookings === 0
              ? "All Pending"
              : "Mixed Status",
          createdAt: services[0]?.createdAt || "",
          mainCustomer: services[0]?.customer || { name: "", number: "" },
          mainVendor: services[0]?.vendor || { name: "", location: "" },
          mainRider: services.find((s) => s.rider)?.rider,
        };
      }
    );

    const customers: ProcessedCustomer[] = [
      ...new Set(serviceData.map((s) => s.customer.name)),
    ].map((name) => {
      const customerServices = serviceData.filter(
        (s) => s.customer.name === name
      );
      const customer = customerServices[0].customer;

      return {
        name,
        phone: customer.number,
        totalServices: customerServices.length,
        orders: customerServices.filter((s) => s.type === "ORDER").length,
        bookings: customerServices.filter((s) => s.type === "BOOKING").length,
        totalSpent: customerServices.reduce((sum, service) => {
          if (service.type === "ORDER") {
            return sum + (service.orderData?.deliveryMetaData?.price || 0);
          }
          if (service.type === "BOOKING") {
            return (
              sum + Number.parseFloat(service.bookingData?.deliveryFee || "0")
            );
          }
          return sum;
        }, 0),
        services: customerServices,
        multiGroups: customerServices
          .filter((s) => s.type === "BOOKING" && s.bookingData?.multiGroupId)
          .map((s) => s.bookingData!.multiGroupId!)
          .filter((id, index, arr) => arr.indexOf(id) === index),
      };
    });

    const vendors: ProcessedVendor[] = [
      ...new Set(serviceData.map((s) => s.vendor.name)),
    ].map((name) => {
      const vendorServices = serviceData.filter((s) => s.vendor.name === name);
      const vendor = vendorServices[0].vendor;

      return {
        name,
        location: vendor.location,
        totalServices: vendorServices.length,
        orders: vendorServices.filter((s) => s.type === "ORDER").length,
        bookings: vendorServices.filter((s) => s.type === "BOOKING").length,
        totalRevenue: vendorServices.reduce((sum, service) => {
          if (service.type === "ORDER") {
            return sum + (service.orderData?.deliveryMetaData?.price || 0);
          }
          if (service.type === "BOOKING") {
            return (
              sum + Number.parseFloat(service.bookingData?.deliveryFee || "0")
            );
          }
          return sum;
        }, 0),
        services: vendorServices,
        customers: [...new Set(vendorServices.map((s) => s.customer.name))]
          .length,
      };
    });

    return {
      orders,
      bookings,
      multiGroups,
      customers,
      vendors,
      stats: {
        totalOrders: orders.length,
        totalBookings: bookings.length,
        totalMultiGroups: multiGroups.length,
        totalCustomers: customers.length,
        totalVendors: vendors.length,
        totalRevenue: serviceData.reduce((sum, service) => {
          if (service.type === "ORDER") {
            return sum + (service.orderData?.deliveryMetaData?.price || 0);
          }
          if (service.type === "BOOKING") {
            return (
              sum + Number.parseFloat(service.bookingData?.deliveryFee || "0")
            );
          }
          return sum;
        }, 0),
      },
    };
  }, [serviceData]);
 

  // Filter function
  const filterData = (data: any[], searchTerm: string) => {
    if (!searchTerm.trim()) return data;

    const term = searchTerm.toLowerCase();
    return data.filter((item: any) => {
      if (item.orderId) {
        return (
          item.orderId.toLowerCase().includes(term) ||
          item.customer?.name?.toLowerCase().includes(term) ||
          item.vendor?.name?.toLowerCase().includes(term)
        );
      } else if (item.bookingId) {
        return (
          item.bookingId.toLowerCase().includes(term) ||
          item.customer?.name?.toLowerCase().includes(term) ||
          item.vendor?.name?.toLowerCase().includes(term)
        );
      } else if (item.shortId) {
        return (
          item.shortId.toLowerCase().includes(term) ||
          item.id.toLowerCase().includes(term) ||
          item.uniqueCustomers.some((name: string) =>
            name.toLowerCase().includes(term)
          ) ||
          item.uniqueVendors.some((name: string) =>
            name.toLowerCase().includes(term)
          )
        );
      } else if (item.name) {
        return (
          item.name.toLowerCase().includes(term) ||
          item.phone?.toLowerCase().includes(term) ||
          item.location?.toLowerCase().includes(term)
        );
      }
      return false;
    });
  };

  // Handle view details
  const handleViewDetails = (item: any, itemType: string) => {
    setSelectedItem({ ...item, itemType });
    setShowDetails(true);
  };

  // Handle close details
  const handleCloseDetails = () => {
    setSelectedItem(null);
    setShowDetails(false);
  };

  // Handle view multi-group bookings
  const handleViewMultiGroupBookings = (multiGroup: MultiGroup) => {
    setSelectedMultiGroup(multiGroup);
    setShowMultiGroupBookings(true);
  };

  // Handle close multi-group bookings
  const handleCloseMultiGroupBookings = () => {
    setSelectedMultiGroup(null);
    setShowMultiGroupBookings(false);
  };

  // Handle view on live map
  const handleViewOnLiveMap = (
    entityId: string,
    entityType: "order" | "booking" | "multigroup" | "customer" | "vendor"
  ) => {
    if (onViewOnLiveMap) {
      let idShort = entityId;
      if (typeof entityId === "string" && entityId.length >= 6) {
        idShort = entityId.slice(-6);
      }
      onViewOnLiveMap(idShort, entityType);
    }
    setShowOrdersBookings(false);
  };

  // Status badge component
  const StatusBadge: React.FC<{ status: string; type?: string }> = ({
    status,
    type = "default",
  }) => {
    const getStatusStyle = () => {
      switch (status) {
        case "CONFIRMED":
        case "Confirmed":
        case "All Confirmed":
          return "bg-green-100 text-green-800";
        case "PENDING":
        case "Pending":
        case "All Pending":
          return "bg-yellow-100 text-yellow-800";
        case "DELIVERED":
          return "bg-blue-100 text-blue-800";
        case "CARGO":
          return "bg-orange-100 text-orange-800 w-fit";
        default:
          return "bg-gray-100 text-gray-800";
      }
    };

    return (
      <Badge className={`${getStatusStyle()} text-xs font-medium`}>
        {status}
      </Badge>
    );
  };

  // Responsive Multi-Group Bookings Dialog
  const MultiGroupBookingsDialog = () => {
    if (!showMultiGroupBookings || !selectedMultiGroup) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white/95 backdrop-blur-3xl border border-white/20 rounded-3xl shadow-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Link className="h-6 w-6 text-indigo-500" />
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-black">
                    Multi-Group #{selectedMultiGroup.shortId}
                  </h3>
                  <p className="text-sm text-black/60">
                    {selectedMultiGroup.totalBookings} bookings • Total: GH₵
                    {selectedMultiGroup.totalFee.toFixed(2)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseMultiGroupBookings}
                className="bg-white/10 backdrop-blur-xl hover:bg-white/20 border border-white/20 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {selectedMultiGroup.confirmedBookings}
                </p>
                <p className="text-xs text-black/60">Confirmed</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-orange-600">
                  {selectedMultiGroup.pendingBookings}
                </p>
                <p className="text-xs text-black/60">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-blue-600">
                  {selectedMultiGroup.uniqueCustomers.length}
                </p>
                <p className="text-xs text-black/60">Customers</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-purple-600">
                  {selectedMultiGroup.uniqueVendors.length}
                </p>
                <p className="text-xs text-black/60">Provider</p>
              </div>
            </div>

            {/* Individual Bookings */}
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <h4 className="text-lg font-semibold flex items-center gap-2 text-black">
                  <Calendar className="h-5 w-5" />
                  All Bookings in this Multi-Group
                </h4>
                <Button
                  onClick={() =>
                    handleViewOnLiveMap(
                      selectedMultiGroup.shortId,
                      "multigroup"
                    )
                  }
                  className="bg-black/90 hover:bg-black text-white rounded-2xl"
                >
                  <LiveMap className="h-4 w-4 mr-2" />
                  View on Live Map
                </Button>
              </div>

              <ScrollArea className="h-96">
                <div className="space-y-3 pr-4">
                  {selectedMultiGroup.services.map((booking, index) => (
                    <div
                      key={booking.id}
                      className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 hover:bg-white/20 transition-all duration-300"
                    >
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-purple-100 text-purple-700 text-xs font-bold">
                              #{index + 1}
                            </Badge>
                            <Calendar className="h-4 w-4 text-purple-500" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-black">
                              Booking #
                              {booking.bookingData?.bookingId?.slice(-6)}
                            </p>
                            <p className="text-sm text-black/60 truncate">
                              Customer: {booking.customer.name} • Phone:{" "}
                              {booking.customer.number}
                            </p>
                            <p className="text-sm text-black/60 truncate">
                              Provider: {booking.vendor.name} • Location:{" "}
                              {booking.vendor.location}
                            </p>
                            <div className="flex flex-wrap items-center gap-4 mt-1">
                              <p className="text-xs text-black/50">
                                📅 {booking.bookingData?.day} • ⏰{" "}
                                {booking.bookingData?.startTime
                                  ? new Date(
                                      booking.bookingData.startTime
                                    ).toLocaleTimeString()
                                  : "N/A"}{" "}
                                -
                                {booking.bookingData?.endTime
                                  ? new Date(
                                      booking.bookingData.endTime
                                    ).toLocaleTimeString()
                                  : "N/A"}
                              </p>
                              <p className="text-xs text-black/50">
                                {booking.bookingData?.tableSize} $
                                {Number(booking.bookingData?.tableSize) === 1
                                  ? "item"
                                  : "items"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <StatusBadge
                            status={
                              booking.bookingData?.isConfirmed
                                ? "Confirmed"
                                : "Pending"
                            }
                          />
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              GH₵{booking.bookingData?.deliveryFee || 0}
                            </p>
                            <p className="text-xs text-black/50">
                              {new Date(booking.createdAt).toLocaleDateString()}
                            </p>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="bg-white/10 hover:bg-white/20"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() => {
                                  handleCloseMultiGroupBookings();
                                  handleViewDetails(booking, "booking");
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Full Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  handleCloseMultiGroupBookings();
                                  handleViewOnLiveMap(
                                    booking.bookingData?.bookingId ||
                                      booking.id,
                                    "booking"
                                  );
                                }}
                              >
                                <LiveMap className="h-4 w-4 mr-2" />
                                View on Live Map
                              </DropdownMenuItem>
                              {booking.rider && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    const rider = riders.find(
                                      (r) => r.id === booking.rider!.id
                                    );
                                    if (rider) {
                                      onRiderClick(rider);
                                      handleCloseMultiGroupBookings();
                                    }
                                  }}
                                >
                                  <Navigation className="h-4 w-4 mr-2" />
                                  Track Rider
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Additional booking details */}
                      <div className="mt-3 pt-3 border-t border-white/20 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        {booking.bookingData?.pickUpAddress && (
                          <div>
                            <p className="text-xs font-medium text-black/60 flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-green-500" />
                              Pickup Address:
                            </p>
                            <p className="text-xs text-black/80 truncate">
                              {booking.bookingData.pickUpAddress}
                            </p>
                          </div>
                        )}
                        {booking.bookingData?.deliveryAddress && (
                          <div>
                            <p className="text-xs font-medium text-black/60 flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-red-500" />
                              Dropoff Address:
                            </p>
                            <p className="text-xs text-black/80 truncate">
                              {booking.bookingData.deliveryAddress}
                            </p>
                          </div>
                        )}
                        {booking.bookingData?.item && (
                          <div>
                            <p className="text-xs font-medium text-black/60">
                              Item/Service:
                            </p>
                            <p className="text-xs text-black/80">
                              {booking.bookingData.item}
                            </p>
                          </div>
                        )}
                        {booking.rider && (
                          <div>
                            <p className="text-xs font-medium text-black/60">
                              Assigned Rider:
                            </p>
                            <p className="text-xs text-black/80 flex items-center gap-1">
                              <Navigation className="h-3 w-3" />
                              {booking.rider.name}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t border-white/20 gap-4">
              <div className="text-sm text-black/60">
                Total Revenue:{" "}
                <span className="font-bold text-green-600">
                  GH₵{selectedMultiGroup.totalFee.toFixed(2)}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={handleCloseMultiGroupBookings}
                className="bg-white/10 backdrop-blur-xl hover:bg-white/20 border border-white/20"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Responsive Details Panel Component
  const DetailsPanel = () => {
    if (!showDetails || !selectedItem) return null;

    const { itemType } = selectedItem;

    return (
     <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-3xl border border-white/20 rounded-3xl shadow-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
       <>
            {/* Header */}
           <div className="p-4 sm:p-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-black">
                {itemType === "order" && (
                  <Package className="h-5 w-5 text-orange-500" />
                )}
                {itemType === "booking" && (
                  <Calendar className="h-5 w-5 text-purple-500" />
                )}
                {itemType === "multigroup" && (
                  <Link className="h-5 w-5 text-indigo-500" />
                )}
                {itemType === "customer" && (
                  <Users className="h-5 w-5 text-blue-500" />
                )}
                {itemType === "vendor" && (
                  <Building className="h-5 w-5 text-green-500" />
                )}

                {itemType === "order" &&
                  `Order #${selectedItem.orderData?.orderId?.slice(-6)}`}
                {itemType === "booking" &&
                  `Booking #${selectedItem.bookingData?.bookingId?.slice(-6)}`}
                {itemType === "multigroup" &&
                  `Multi-Group #${selectedItem.shortId}`}
                {itemType === "customer" && `Customer: ${selectedItem.name}`}
                {itemType === "vendor" && `Vendor: ${selectedItem.name}`}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseDetails}
                className="bg-white/10 backdrop-blur-xl hover:bg-white/20 border border-white/20 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Scrollable Content */}
           <ScrollArea className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 space-y-4">
              
              <>
                {/* Content based on item type - keeping original logic but making responsive */}
                {itemType === "order" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-black/60">
                          Order ID
                        </p>
                        <p className="text-sm text-black break-all">
                          {selectedItem.orderData?.orderId}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-black/60">
                          Status
                        </p>
                        <StatusBadge status={selectedItem.orderData?.status} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-black/60">
                          Customer
                        </p>
                        <p className="text-sm text-black">
                          {selectedItem.customer.name}
                        </p>
                        <p className="text-xs text-black/60">
                          {selectedItem.customer.number}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-black/60">
                          Vendor
                        </p>
                        <p className="text-sm text-black">
                          {selectedItem.vendor.name}
                        </p>
                        <p className="text-xs text-black/60 truncate">
                          {selectedItem.vendor.location}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-black/60">
                          Total Fee
                        </p>
                        <p className="text-sm font-bold text-green-600">
                          {/* {selectedItem.orderData?.deliveryMetaData?.price || 0} */}
                          {formatPrice(
                            calculateSelectedItemsWithdeliveryPrice({
                              productInfor:
                                selectedItem?.orderData?.productInfor ?? [],
                              serviceFee: selectedItem?.orderData?.serviceFee,
                            })
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-black/60">
                          Products
                        </p>
                        <p className="text-sm font-bold text-green-600">
                          {/* {selectedItem.orderData?.deliveryMetaData?.price || 0} */}
                          {formatPrice(
                            calculateSelectedItemTotalPrice({
                              productInfor:
                                selectedItem?.orderData?.productInfor ?? [],
                            })
                          )}
                        </p>
                      </div>{" "}
                      <div>
                        <p className="text-sm font-medium text-black/60">
                          Delivery
                        </p>
                        <p className="text-sm font-bold text-green-600">
                          GH₵
                          {selectedItem.orderData?.serviceFee || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-black/60">
                          Distance
                        </p>
                        <p className="text-sm text-black">
                          {selectedItem.orderData?.order.distance ||
                            0}
                          km
                        </p>
                      </div>
                    </div>

                    {/* Pickup and Delivery Addresses for Orders */}
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <p className="text-sm font-medium text-black/60 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-green-500" />
                          Pickup Address (Vendor)
                        </p>
                        <p className="text-sm text-black">
                          {selectedItem.vendor.location}
                        </p>
                      </div>
                      {selectedItem.orderData?.deliveryAddress && (
                        <div>
                          <p className="text-sm font-medium text-black/60 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-red-500" />
                            Delivery Address
                          </p>
                          <p className="text-sm text-black">
                            {selectedItem.orderData.deliveryAddress}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Route and Delivery Zone Information */}
                    {selectedItem.orderData?.deliveryMetaData?.zone && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-black/60">
                            Delivery Zone
                          </p>
                          <p className="text-sm text-black">
                            {selectedItem.orderData.deliveryMetaData.zone}
                          </p>
                        </div>
                        {selectedItem.orderData?.estimatedDeliveryDate && (
                          <div>
                            <p className="text-sm font-medium text-black/60">
                              Estimated Delivery
                            </p>
                            <p className="text-sm text-black">
                              {new Date(
                                selectedItem.orderData.estimatedDeliveryDate
                              ).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                      {selectedItem?.orderData?.productInfor.map((item, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Quantity</span>
            <span className="text-sm text-black">{item.quantity}</span>
          </div>
  <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Item Type</span>
            <span className="text-sm text-black">{item.itemType}</span>
          </div>
          {item.product.map((prod) => (
            <div key={prod.id} className="flex items-center gap-4 mt-2">
              <img
                src={prod.imageUrls?.[0] ?? "/fallback.jpg"}
                alt={prod.name}
                className="w-12 h-12 rounded-md object-cover border"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-black">{prod.name}</p>
                {/* <p className="text-xs text-gray-500">State: {prod.state}</p> */}
                <p className="text-sm text-green-600 font-medium">
                  {formatPrice(prod.price)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ))}

                    {selectedItem.rider && (
                      <div>
                        <p className="text-sm font-medium text-black/60">
                          Assigned Rider
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-black">
                            {selectedItem.rider.name}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const rider = riders.find(
                                (r) => r.id === selectedItem.rider.id
                              );
                              if (rider) {
                                onRiderClick(rider);
                                handleCloseDetails();
                              }
                            }}
                            className="bg-white/10 backdrop-blur-xl hover:bg-white/20 border border-white/20"
                          >
                            <Navigation className="h-3 w-3 mr-1" />
                            Track
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Similar responsive treatment for other item types... */}
                {/* Keeping the original logic but making it mobile-friendly */}

                {itemType === "booking" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-black/60">
                          Booking ID
                        </p>
                        <p className="text-sm text-black break-all">
                          {selectedItem.bookingData?.bookingId}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-black/60">
                          Status
                        </p>
                        <StatusBadge
                          status={
                            selectedItem.bookingData?.isConfirmed
                              ? "Confirmed"
                              : "Pending"
                          }
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-black/60">
                          Customer
                        </p>
                        <p className="text-sm text-black">
                          {selectedItem.customer.name}
                        </p>
                        <p className="text-xs text-black/60">
                          {selectedItem.customer.number}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-black/60">
                          Provider
                        </p>
                        <p className="text-sm text-black">
                          {selectedItem.vendor.name}
                        </p>
                        <p className="text-xs text-black/60 truncate">
                          {selectedItem.vendor.location}
                        </p>
                      </div>
                      <div className="gap-2 ">
                        <p className="text-sm font-medium text-black/60">
                          items details
                        </p>
                        <p className="text-sm text-black">
                          {selectedItem.bookingData?.tableSize}{" "}
                          {Number(selectedItem.bookingData.tableSize) === 1
                            ? "item"
                            : "items"}
                        </p>
                        <p className="text-sm text-black">
                          {selectedItem.bookingData.item}
                        </p>
                        <p className="text-sm text-black">
                          {selectedItem.bookingData.notes || "N/A"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-black/60">Day</p>
                        <p className="text-sm text-black">
                          {selectedItem.bookingData?.day}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-black/60">
                          Time
                        </p>
                        <p className="text-sm text-black">
                          {selectedItem.bookingData?.startTime
                            ? new Date(
                                selectedItem.bookingData.startTime
                              ).toLocaleTimeString()
                            : "N/A"}{" "}
                          -
                          {selectedItem.bookingData?.endTime
                            ? new Date(
                                selectedItem.bookingData.endTime
                              ).toLocaleTimeString()
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-black/60">
                          Delivery Fee
                        </p>
                        <p className="text-sm font-bold text-green-600">
                          GH₵{selectedItem.bookingData?.deliveryFee || 0}
                        </p>
                      </div>
                    </div>

                    {selectedItem.bookingData?.multiGroupId && (
                      <div>
                        <p className="text-sm font-medium text-black/60">
                          Multi-Group ID
                        </p>
                        <p className="text-sm text-indigo-600 font-medium">
                          #{selectedItem.bookingData.multiGroupId.slice(-6)}
                        </p>
                      </div>
                    )}

                    {/* Pickup and Delivery Addresses for Bookings */}
                    <div className="grid grid-cols-1 gap-4">
                      {selectedItem.bookingData?.pickUpAddress && (
                        <div>
                          <p className="text-sm font-medium text-black/60 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-green-500" />
                            Pickup Address
                          </p>
                          <p className="text-sm text-black">
                            {selectedItem.bookingData.pickUpAddress}
                          </p>
                        </div>
                      )}

                      {selectedItem.bookingData?.deliveryAddress && (
                        <div>
                          <p className="text-sm font-medium text-black/60 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-red-500" />
                            Dropoff Address
                          </p>
                          <p className="text-sm text-black">
                            {selectedItem.bookingData.deliveryAddress}
                          </p>
                        </div>
                      )}
                    </div>

                    {selectedItem.rider && (
                      <div>
                        <p className="text-sm font-medium text-black/60">
                          Assigned Rider
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-black">
                            {selectedItem.rider.name}
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const rider = riders.find(
                                (r) => r.id === selectedItem.rider.id
                              );
                              if (rider) {
                                onRiderClick(rider);
                                handleCloseDetails();
                              }
                            }}
                            className="bg-white/10 backdrop-blur-xl hover:bg-white/20 border border-white/20"
                          >
                            <Navigation className="h-3 w-3 mr-1" />
                            Track
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Continue with other item types... */}
              </>
            </ScrollArea>

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-white/20">
              <Button
                variant="outline"
                onClick={handleCloseDetails}
                className="bg-white/10 backdrop-blur-xl hover:bg-white/20 border border-white/20"
              >
                Close
              </Button>
            </div>
          </>
        </div>
      </div>
    );
  };
  
  // Calculates the total price of all products in the order
  // Calculates the total price of all products in the order
  // Calculates the total price of all products in the order
  const calculateSelectedItemTotalPrice = ({
    productInfor,
  }: {
    productInfor: productInfor[];
  }): number => {
    if (!productInfor) return 0;

    return productInfor.reduce((total, item) => {
      const productTotal = item.product.reduce((sum, product) => {
        const price =
          typeof product.price === "string"
            ? parseFloat(product.price)
            : product.price ?? 0;
        return sum + price;
      }, 0);

      return total + productTotal * item.quantity;
    }, 0);
  };

  // Calculates total price with delivery fee included
  const calculateSelectedItemsWithdeliveryPrice = ({
    productInfor,
    serviceFee,
  }: {
    productInfor: productInfor[];
    serviceFee?: string;
  }): number => {
    const productTotal = calculateSelectedItemTotalPrice({ productInfor });
    const deliveryFee =
      typeof serviceFee === "string" ? parseFloat(serviceFee) : serviceFee ?? 0;

    return parseFloat((productTotal + deliveryFee).toFixed(2));
  };

  // Calculates total quantity of items in the order
  const calculateSelectedItemItemsCount = ({
    productInfor,
  }: {
    productInfor: productInfor[];
  }): number => {
    if (!productInfor) return 0;

    return productInfor.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <div className="h-full px-1 flex flex-col bg-gradient-to-br from-gray-100 via-white to-gray-50">
      {/* Details Panel */}
      <DetailsPanel />
     {selectedItem?.orderData?.productInfor && (
  <DetailsPanelProductInfor
    productInfor={selectedItem.orderData.productInfor}
  />
)}


      {/* Multi-Group Bookings Dialog */}
      <MultiGroupBookingsDialog />

      {/* Tabs Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="h-full"
        >
          <TabsList className="flex-shrink-0 px-4">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Orders</span>
              <span className="sm:hidden">
                ({processedData.stats.totalOrders})
              </span>
              <span className="hidden sm:inline">
                ({processedData.stats.totalOrders})
              </span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Bookings</span>
              <span className="sm:hidden">
                ({processedData.stats.totalBookings})
              </span>
              <span className="hidden sm:inline">
                ({processedData.stats.totalBookings})
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="multigroups"
              className="flex items-center gap-2"
            >
              <Link className="h-4 w-4" />
              <span className="hidden sm:inline">Multi-Groups</span>
              <span className="sm:hidden">
                ({processedData.stats.totalMultiGroups})
              </span>
              <span className="hidden sm:inline">
                ({processedData.stats.totalMultiGroups})
              </span>
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Customers</span>
              <span className="sm:hidden">
                ({processedData.stats.totalCustomers})
              </span>
              <span className="hidden sm:inline">
                ({processedData.stats.totalCustomers})
              </span>
            </TabsTrigger>
            <TabsTrigger value="vendors" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span className="hidden sm:inline">Vendors</span>
              <span className="sm:hidden">
                ({processedData.stats.totalVendors})
              </span>
              <span className="hidden sm:inline">
                ({processedData.stats.totalVendors})
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <ScrollArea className="h-full p-4 sm:p-6">
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <Package className="h-6 w-6 text-orange-600" />
                      <div>
                        <p className="text-sm text-black/60">Orders</p>
                        <p className="text-xl sm:text-2xl font-bold text-orange-600">
                          {processedData.stats.totalOrders}
                        </p>
                        <p className="text-xs text-black/50">
                          Active deliveries
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-6 w-6 text-purple-600" />
                      <div>
                        <p className="text-sm text-black/60">Bookings</p>
                        <p className="text-xl sm:text-2xl font-bold text-purple-600">
                          {processedData.stats.totalBookings}
                        </p>
                        <p className="text-xs text-black/50">Reservations</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <Link className="h-6 w-6 text-indigo-600" />
                      <div>
                        <p className="text-sm text-black/60">Multi-Groups</p>
                        <p className="text-xl sm:text-2xl font-bold text-indigo-600">
                          {processedData.stats.totalMultiGroups}
                        </p>
                        <p className="text-xs text-black/50">Group bookings</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <Users className="h-6 w-6 text-blue-600" />
                      <div>
                        <p className="text-sm text-black/60">Customers</p>
                        <p className="text-xl sm:text-2xl font-bold text-blue-600">
                          {processedData.stats.totalCustomers}
                        </p>
                        <p className="text-xs text-black/50">Unique users</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <Building className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="text-sm text-black/60">Vendors</p>
                        <p className="text-xl sm:text-2xl font-bold text-green-600">
                          {processedData.stats.totalVendors}
                        </p>
                        <p className="text-xs text-black/50">Partners</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-6 w-6 text-emerald-600" />
                      <div>
                        <p className="text-sm text-black/60">Revenue</p>
                        <p className="text-xl sm:text-2xl font-bold text-emerald-600">
                          GH₵{processedData.stats.totalRevenue.toFixed(0)}
                        </p>
                        <p className="text-xs text-black/50">Total earnings</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {serviceData.slice(0, 8).map((service, index) => (
                        <div
                          key={index}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-[#dcdcdc] backdrop-blur-xl rounded-2xl border border-white/20 gap-3"
                        >
                          <div className="flex items-center  gap-3 flex-1 min-w-0">
                            {service.type === "ORDER" ? (
                              <Package className="h-5 w-5 text-orange-500 flex-shrink-0" />
                            ) : (
                              <Calendar className="h-5 w-5 text-purple-500 flex-shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm text-black">
                                {service.type === "ORDER"
                                  ? `Order #${service.orderData?.orderId?.slice(
                                      -6
                                    )}`
                                  : `Booking #${service.bookingData?.bookingId?.slice(
                                      -6
                                    )}`}
                              </p>
                              <p className="text-xs text-black/60 truncate">
                                {service.customer.name}
                              </p>
                              {service.type === "BOOKING" &&
                                service.bookingData?.multiGroupId && (
                                  <p className="text-xs text-indigo-600 font-medium">
                                    🔗 #
                                    {service.bookingData.multiGroupId.slice(-6)}
                                  </p>
                                )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-sm text-green-600">
                              GH₵
                              {service.type === "ORDER"
                                ? service.orderData?.deliveryMetaData?.price ||
                                  0
                                : service.bookingData?.deliveryFee || 0}
                            </p>
                            <p className="text-xs text-black/50">
                              {new Date(service.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Performers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Customers */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Top Customers
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {processedData.customers
                          .sort((a, b) => b.totalSpent - a.totalSpent)
                          .slice(0, 5)
                          .map((customer, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-[#dcdcdc] backdrop-blur-xl border border-white/20 rounded-2xl"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">
                                  {index + 1}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-sm text-black truncate">
                                    {customer.name}
                                  </p>
                                  <p className="text-xs text-black/60">
                                    {customer.totalServices} services
                                  </p>
                                </div>
                              </div>
                              <p className="font-bold text-green-600 flex-shrink-0">
                                GH₵{customer.totalSpent.toFixed(2)}
                              </p>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Vendors */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Top Vendors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {processedData.vendors
                          .sort((a, b) => b.totalRevenue - a.totalRevenue)
                          .slice(0, 5)
                          .map((vendor, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-600 flex-shrink-0">
                                  {index + 1}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-sm text-black truncate">
                                    {vendor.name}
                                  </p>
                                  <p className="text-xs text-black/60">
                                    {vendor.totalServices} services
                                  </p>
                                </div>
                              </div>
                              <p className="font-bold text-green-600 flex-shrink-0">
                                GH₵{vendor.totalRevenue.toFixed(2)}
                              </p>
                            </div>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <ScrollArea className="h-full p-4 sm:p-6">
              <div className="space-y-3">
                {filterData(processedData.orders, searchQuery).map(
                  (order: ServiceData) => (
                    <Card
                      key={order.id}
                      className="p-3 sm:p-4 bg-white/10 backdrop-blur-xl border border-white/20"
                    >
                      <div className="flex flex-col gap-3">
                        {/* Top row - Icon, Title, Status */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Package className="h-5 w-5 text-orange-500 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-black text-sm sm:text-base">
                                Order #{order.orderData?.orderId?.slice(-6)}
                              </p>
                            </div>
                          </div>
                          <StatusBadge status={order.orderData?.status || ""} />
                        </div>

                        {/* Middle row - Customer and Vendor info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <div className="min-w-0">
                            <p className="text-black/60 truncate">
                              👤 {order.customer.name}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-black/50 truncate">
                              🏪 {order.vendor.name}
                            </p>
                          </div>
                        </div>

                        {/* Bottom row - Price, Date, Actions */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="font-bold text-green-600 text-sm sm:text-base">
                                {formatPrice(
                                  calculateSelectedItemsWithdeliveryPrice({
                                    productInfor:
                                      order?.orderData?.productInfor ?? [],
                                    serviceFee: order?.orderData?.serviceFee,
                                  })
                                )}
                              </p>
                              <p>
                                <span className="font-mono text-gray-500">
                                  Product :
                                </span>{" "}
                                <span className="font-thin text-green-500">
                                  {formatPrice(
                                    calculateSelectedItemTotalPrice({
                                      productInfor:
                                        order?.orderData?.productInfor ?? [],
                                    })
                                  )}
                                </span>
                              </p>
                              
                              <p>
                                <span className="font-mono text-gray-500">
                                  Delivery :
                                </span>{" "}
                                <span className="font-thin text-green-500">
                                  {formatPrice(
                                    order?.orderData?.serviceFee
                                  ) || "0"}
                                </span>
                              </p>
                              <p className="text-xs text-black/50">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-full p-2"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleViewDetails(order, "order")
                                }
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleViewOnLiveMap(
                                    order.orderData?.orderId || order.id,
                                    "order"
                                  )
                                }
                              >
                                <LiveMap className="h-4 w-4 mr-2" />
                                View on Live Map
                              </DropdownMenuItem>
                              <div
                                className={cn(
                                  "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0"
                                )}
                              >
                                <ReAssignRiderDialog
                                  entityId={
                                    order.orderData?.orderId || order.id
                                  }
                                  entityType="order"
                                  currentRiderId={order.rider?.id || null}
                                  currentRiderName={order.rider?.name || null}
                                />
                              </div>
                              {order.rider && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    const rider = riders.find(
                                      (r) => r.id === order.rider!.id
                                    );
                                    if (rider) onRiderClick(rider);
                                  }}
                                >
                                  <Navigation className="h-4 w-4 mr-2" />
                                  Track Rider
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </Card>
                  )
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            {/* work here about the delete state */}
            <ScrollArea className="h-full p-4 sm:p-6">
              <div className="space-y-3">
                {filterData(processedData.bookings, searchQuery).map(
                  (booking) => (
                    <Card
                      key={booking.id}
                      className="p-3 sm:p-4 bg-white/10 backdrop-blur-xl border border-white/20"
                    >
                      <div className="flex flex-col gap-3">
                        {/* Top row - Icon, Title, Status */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Calendar className="h-5 w-5 text-purple-500 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-black text-sm sm:text-base">
                                Booking #
                                {booking.bookingData?.bookingId?.slice(-6)}
                              </p>
                              {booking.bookingData?.multiGroupId && (
                                <p className="text-xs text-indigo-600 font-medium">
                                  🔗 #
                                  {booking.bookingData.multiGroupId.slice(-6)}
                                </p>
                              )}

                              {booking.bookingData?.cargoId && (
                                <span className="flex items-center gap-1">
                                  <img
                                    src={cargo}
                                    alt="Cargo"
                                    className="h-4 w-4 inline-block"
                                  />
                                  <span className="text-xs text-indigo-600 font-medium">
                                    #{booking.bookingData.cargoId.slice(-6)}
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <StatusBadge
                              status={booking.bookingData?.status ?? "Pending"}
                            />
                            {booking.bookingData?.cargoId && (
                              <StatusBadge
                                status={
                                  booking.bookingData?.cargoId ? "CARGO" : ""
                                }
                              />
                            )}
                          </div>
                        </div>

                        {/* Middle row - Customer and Vendor info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <div className="min-w-0">
                            <p className="text-black/60 truncate">
                              👤 {booking.customer.name}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-black/50 truncate">
                              🏪 {booking.vendor.name}
                            </p>
                          </div>
                        </div>

                        {/* Bottom row - Price, Date, Actions */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-4">
                            <div>
                              {!booking.bookingData?.cargoId ? (
                                <p className="font-bold text-green-600 text-sm sm:text-base">
                                  GH₵{booking.bookingData?.deliveryFee || 0}
                                </p>
                              ) : (
                                <PaymentStatusSectionAssigned
                                  booking={booking}
                                />
                              )}
                              <p className="text-xs text-black/50">
                                {booking.bookingData?.day}
                              </p>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-full p-2"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleViewDetails(booking, "booking")
                                }
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={isDeleting === booking.id}
                                onClick={() =>
                                  // handleViewDetails(booking, "booking")

                                  handleDeleteBooking(
                                    booking.bookingData?.bookingId,
                                    "BOOKING"
                                  )
                                }
                              >
                                {/* <Eye className="h-4 w-4 mr-2" /> */}
                                <Trash2 className="h-4 w-4 mr-2" />

                                {isDeleting === booking.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </DropdownMenuItem>
                              <div
                                className={cn(
                                  "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0"
                                )}
                              >
                                <ReAssignRiderDialog
                                  entityId={
                                    booking.bookingData?.bookingId || booking.id
                                  }
                                  entityType="booking"
                                  currentRiderId={booking.rider?.id || null}
                                  currentRiderName={booking.rider?.name || null}
                                />
                              </div>

                              <DropdownMenuItem
                                onClick={() =>
                                  handleViewOnLiveMap(
                                    booking.bookingData?.bookingId ||
                                      booking.id,
                                    "booking"
                                  )
                                }
                              >
                                <LiveMap className="h-4 w-4 mr-2" />
                                View on Live Map
                              </DropdownMenuItem>
                              {booking.rider && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    const rider = riders.find(
                                      (r) => r.id === booking.rider!.id
                                    );
                                    if (rider) onRiderClick(rider);
                                  }}
                                >
                                  <Navigation className="h-4 w-4 mr-2" />
                                  Track Rider
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </Card>
                  )
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Multi-Groups Tab */}
          <TabsContent value="multigroups">
            <ScrollArea className="h-full p-4 sm:p-6">
              <div className="space-y-3">
                {filterData(processedData.multiGroups, searchQuery).map(
                  (multiGroup) => (
                    <Card
                      key={multiGroup.id}
                      className="p-3 sm:p-4 bg-white/10 backdrop-blur-xl border border-white/20"
                    >
                      <div className="flex flex-col gap-3">
                        {/* Top row - Icon, Title, Status */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <Link className="h-5 w-5 text-indigo-500 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-black text-sm sm:text-base">
                                Multi-Group #{multiGroup.shortId}
                              </p>
                            </div>
                          </div>
                          <StatusBadge status={multiGroup.status} />
                        </div>

                        {/* Middle row - Stats info */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                          <div className="text-center">
                            <p className="text-xs text-black/50">Bookings</p>
                            <p className="text-black/70 font-medium">
                              {multiGroup.totalBookings}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-black/50">Customers</p>
                            <p className="text-black/70 font-medium">
                              {multiGroup.uniqueCustomers.length}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-black/50">Confirmed</p>
                            <p className="text-green-600 font-medium">
                              {multiGroup.confirmedBookings}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-black/50">Pending</p>
                            <p className="text-orange-600 font-medium">
                              {multiGroup.pendingBookings}
                            </p>
                          </div>
                        </div>

                        {/* Bottom row - Price, Date, Actions */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="font-bold text-green-600 text-sm sm:text-base">
                                GH₵{multiGroup.totalFee.toFixed(2)}
                              </p>
                              <p className="text-xs text-black/50">
                                Avg: GH₵
                                {(
                                  multiGroup.totalFee / multiGroup.totalBookings
                                ).toFixed(2)}
                              </p>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-full p-2"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleViewMultiGroupBookings(multiGroup)
                                }
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View All Bookings
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleViewOnLiveMap(
                                    multiGroup.id,
                                    "multigroup"
                                  )
                                }
                              >
                                <LiveMap className="h-4 w-4 mr-2" />
                                View on Live Map
                              </DropdownMenuItem>
                              {multiGroup.mainRider && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    const rider = riders.find(
                                      (r) => r.id === multiGroup.mainRider!.id
                                    );
                                    if (rider) onRiderClick(rider);
                                  }}
                                >
                                  <Navigation className="h-4 w-4 mr-2" />
                                  Track Rider
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </Card>
                  )
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers">
            <ScrollArea className="h-full p-4 sm:p-6">
              <div className="space-y-3">
                {filterData(processedData.customers, searchQuery).map(
                  (customer, index) => (
                    <Card
                      key={index}
                      className="p-3 sm:p-4 bg-white/10 backdrop-blur-xl border border-white/20"
                    >
                      <div className="flex flex-col gap-3">
                        {/* Top row - Icon, Title */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Users className="h-5 w-5 text-blue-500 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-black text-sm sm:text-base">
                              {customer.name}
                            </p>
                            <p className="text-xs text-black/60 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </p>
                          </div>
                        </div>

                        {/* Middle row - Service stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                          <div className="text-center">
                            <p className="text-xs text-black/50">Orders</p>
                            <p className="text-orange-600 font-medium">
                              {customer.orders}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-black/50">Bookings</p>
                            <p className="text-purple-600 font-medium">
                              {customer.bookings}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-black/50">
                              Multi-Groups
                            </p>
                            <p className="text-indigo-600 font-medium">
                              {customer.multiGroups.length}
                            </p>
                          </div>
                        </div>

                        {/* Bottom row - Price, Actions */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="font-bold text-green-600 text-sm sm:text-base">
                                GH₵{customer.totalSpent.toFixed(2)}
                              </p>
                              <p className="text-xs text-black/50">
                                {customer.totalServices} total services
                              </p>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-full p-2"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleViewDetails(customer, "customer")
                                }
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View All Services
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleViewOnLiveMap(customer.name, "customer")
                                }
                              >
                                <LiveMap className="h-4 w-4 mr-2" />
                                View on Live Map
                              </DropdownMenuItem>
                              {customer.multiGroups.length > 0 && (
                                <DropdownMenuItem>
                                  <Link className="h-4 w-4 mr-2" />
                                  View Multi-Groups
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Multi-Groups Summary - only show if exists */}
                        {customer.multiGroups.length > 0 && (
                          <div className="pt-2 border-t border-white/20">
                            <div className="flex flex-wrap gap-1">
                              <span className="text-xs text-black/60 mr-2">
                                Multi-Groups:
                              </span>
                              {customer.multiGroups
                                .slice(0, 3)
                                .map((mgId, mgIndex) => (
                                  <Badge
                                    key={mgIndex}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    #{mgId.slice(-6)}
                                  </Badge>
                                ))}
                              {customer.multiGroups.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{customer.multiGroups.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  )
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Vendors Tab */}
          <TabsContent value="vendors">
            <ScrollArea className="h-full p-4 sm:p-6">
              <div className="space-y-3">
                {filterData(processedData.vendors, searchQuery).map(
                  (vendor, index) => (
                    <Card
                      key={index}
                      className="p-3 sm:p-4 bg-white/10 backdrop-blur-xl border border-white/20"
                    >
                      <div className="flex flex-col gap-3">
                        {/* Top row - Icon, Title */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Building className="h-5 w-5 text-green-500 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-black text-sm sm:text-base">
                              {vendor.name}
                            </p>
                            <p className="text-xs text-black/60 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">
                                {vendor.location}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Middle row - Service stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                          <div className="text-center">
                            <p className="text-xs text-black/50">Orders</p>
                            <p className="text-orange-600 font-medium">
                              {vendor.orders}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-black/50">Bookings</p>
                            <p className="text-purple-600 font-medium">
                              {vendor.bookings}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-black/50">Customers</p>
                            <p className="text-blue-600 font-medium">
                              {vendor.customers}
                            </p>
                          </div>
                        </div>

                        {/* Bottom row - Price, Actions */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="font-bold text-green-600 text-sm sm:text-base">
                                GH₵{vendor.totalRevenue.toFixed(2)}
                              </p>
                              <p className="text-xs text-black/50">
                                {vendor.totalServices} total services
                              </p>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-full p-2"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleViewDetails(vendor, "vendor")
                                }
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View All Services
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleViewOnLiveMap(vendor.name, "vendor")
                                }
                              >
                                <LiveMap className="h-4 w-4 mr-2" />
                                View on Live Map
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Users className="h-4 w-4 mr-2" />
                                View Customers
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </Card>
                  )
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
      {dialogState && (
        <NotificationAlertDialog
          isOpen={dialogState.isOpen}
          onClose={closeDialog}
          title={dialogState.title}
          description={dialogState.description}
          type={dialogState.type}
          onConfirm={dialogState.onConfirm}
          isLoading={isDeleting !== null}
          confirmText="Delete"
        />
      )}
    </div>
  );
};
import { Image } from "lucide-react";
// import { formatPrice } from "@/lib/utils";

interface DetailsPanelProductInforProps {
  productInfor: productInfor[];
}

export const DetailsPanelProductInfor = ({ productInfor }: DetailsPanelProductInforProps) => {
  if (!productInfor || productInfor.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">No products in this order.</p>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-black/60">Product Details</h4>
      {productInfor.map((item, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Quantity</span>
            <span className="text-sm text-black">{item.quantity}</span>
          </div>

          {item.product.map((prod) => (
            <div key={prod.id} className="flex items-center gap-4 mt-2">
              <img
                src={prod.imageUrls?.[0] ?? "/fallback.jpg"}
                alt={prod.name}
                className="w-12 h-12 rounded-md object-cover border"
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-black">{prod.name}</p>
                <p className="text-xs text-gray-500">State: {prod.state}</p>
                <p className="text-sm text-green-600 font-medium">
                  {formatPrice(prod.price)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

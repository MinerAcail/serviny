import { useState } from "react";
import { useMutation, gql, useQuery } from "@apollo/client";
import {
  Check,
  Info,
  Calendar,
  Box,
  Users,
  Zap,
  Package,
  FileText,
  Clock,
} from "lucide-react";

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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import WorksNav from "../custom/nav";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { GET_BOOK_TYPES } from "@/app/vendors/available";
import { useNavigate } from "react-router";
import { useAuth } from "@/middleware/context/authContext";

const UPDATE_BOOKING_TYPE = gql`
  mutation updateBookingType($type: BookingType!) {
    updateBookingType(type: $type)
  }
`;

export enum BookType {
  APPOINTMENT = "APPOINTMENT",
  RENTAL = "RENTAL",
  EVENT = "EVENT",
  ON_DEMAND = "ON_DEMAND",
  PACKAGE = "PACKAGE",
  CUSTOM_QUOTE = "CUSTOM_QUOTE",
}

interface BookingType {
  id: string;
  title: string;
  useCases: string[];
  features: string[];
  description: string;
  icon: React.ReactNode;
  type: BookType;
}

export default function BookingTypes() {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [updateBookingType] = useMutation(UPDATE_BOOKING_TYPE, {
    refetchQueries: [{ query: GET_BOOK_TYPES }],
  });

  const { data: bookingTypeData } = useQuery(GET_BOOK_TYPES, {
    variables: { serviceId: user?.id },
  });

  // Get current booking types from API response
  const currentBookingTypes: string[] = Array.isArray(
    bookingTypeData?.getBookingType
  )
    ? bookingTypeData.getBookingType
    : [];

  const navigate = useNavigate();

  const handleSelect = (id: string) => {
    // Check if the selected type is in coming soon
    const type = bookingTypes.find(t => t.id === id);
    if (type && ComingSoon.includes(type.type)) {
      toast.info("Coming Soon!", {
        description: `The ${type.title} feature is coming soon. Stay tuned for updates!`,
      });
      return;
    }
    setSelectedType(id);
  };

  const handleSubmit = async () => {
    if (!selectedType) return;
    try {
      await updateBookingType({
        variables: { type: selectedType.toUpperCase() },
      });

      // Based on the toggle behavior - customize message based on whether we added or removed
      const typeTitle = bookingTypes.find((t) => t.id === selectedType)?.title;
      const wasAlreadySelected = currentBookingTypes.includes(
        selectedType.toUpperCase()
      );

      toast.success("Success!", {
        description: wasAlreadySelected
          ? `Booking type "${typeTitle}" has been removed.`
          : `Booking type "${typeTitle}" has been added.`,
      });

      navigate(`/providers/${user?.id}`);
    } catch (err) {
      toast.error("Error occurred while updating the booking type.", {
        description:
          err instanceof Error ? err.message : "Please try again later.",
      });
    }
  };

  const ComingSoon = [
    // BookType.RENTAL,
    // BookType.EVENT,
    BookType.ON_DEMAND,
    BookType.PACKAGE,
    BookType.CUSTOM_QUOTE,
  ];

  const bookingTypes: BookingType[] = [
    {
      id: "appointment",
      title: "Appointment-Based Booking",
      useCases: [
        "Salons",
        "Barbers",
        "Therapists",
        "Personal trainers",
        "Consultants",
      ],
      features: [
        "Time slot selection",
        "Duration per service",
        "Provider availability",
      ],
      description:
        "Perfect for businesses that offer services at specific times with fixed durations.",
      icon: <Calendar className="h-6 w-6" />,
      type: BookType.APPOINTMENT,
    },
    {
      id: "rental",
      title: "Rental-Based Booking",
      useCases: ["Equipment rental", "Space rental", "Vehicle hire", "Studios"],
      features: [
        "Date/time range booking",
        "Inventory management",
        "Deposit options",
      ],
      description:
        "Ideal for businesses that rent out items or spaces for varying durations.",
      icon: <Box className="h-6 w-6" />,
      type: BookType.RENTAL,
    },
    {
      id: "event",
      title: "Event-Based Booking",
      useCases: ["Classes", "Workshops", "Concerts", "Group sessions"],
      features: [
        "Limited seat count",
        "Ticketing",
        "Calendar display",
        "Recurring events",
      ],
      description:
        "Great for businesses hosting events with multiple attendees at the same time.",
      icon: <Users className="h-6 w-6" />,
      type: BookType.EVENT,
    },
    {
      id: "ondemand",
      title: "On-Demand Booking",
      useCases: [
        "Delivery services",
        "House cleaning",
        "Towing",
        "Home repairs",
      ],
      features: [
        "Instant booking",
        "Nearest provider dispatch",
        "Live tracking (optional)",
      ],
      description:
        "Suitable for services that respond quickly to customer needs as they arise.",
      icon: <Zap className="h-6 w-6" />,
      type: BookType.ON_DEMAND,
    },
    {
      id: "package",
      title: "Package Booking",
      useCases: ["Coaching", "Spa sessions", "Subscription-based services"],
      features: [
        "Multiple session bundles",
        "Validity period",
        "Usage tracking",
      ],
      description:
        "Perfect for services sold as packages or bundles used over time.",
      icon: <Package className="h-6 w-6" />,
      type: BookType.PACKAGE,
    },
    {
      id: "custom",
      title: "Custom Quote Booking",
      useCases: [
        "Freelancers",
        "Custom services",
        "Construction",
        "Decorators",
      ],
      features: [
        "User requests quote",
        "Provider responds",
        "Booking confirmed",
      ],
      description:
        "Ideal for services that require assessment before providing a price.",
      icon: <FileText className="h-6 w-6" />,
      type: BookType.CUSTOM_QUOTE,
    },
  ];

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="pb-10">
        <WorksNav />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {bookingTypes.map((type) => {
          // Check if this type is already selected
          const isAlreadySelected = currentBookingTypes.includes(type.type);
          const isComingSoon = ComingSoon.includes(type.type);

          return (
            <Card
              key={type.id}
              className={`transition-all duration-300 hover:shadow-lg border overflow-hidden ${
                selectedType === type.id
                  ? "ring-2 ring-primary border-primary bg-primary/5"
                  : isAlreadySelected
                  ? "ring-1 ring-primary/30 border-primary/30 bg-primary/5"
                  : isComingSoon
                  ? "opacity-80"
                  : "hover:border-primary/20"
              }`}
            >
              <div
                className={`h-2 w-full ${
                  selectedType === type.id
                    ? "bg-primary"
                    : isAlreadySelected
                    ? "bg-primary/50"
                    : "bg-muted"
                }`}
              />
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        selectedType === type.id
                          ? "bg-primary text-primary-foreground"
                          : isAlreadySelected
                          ? "bg-primary/20"
                          : "bg-muted"
                      }`}
                    >
                      {type.icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        {type.title}
                        {isAlreadySelected && (
                          <span className="ml-2 text-sm font-normal text-primary">
                            (Active)
                          </span>
                        )}
                      </CardTitle>
                      {isComingSoon && (
                        <div className="flex items-center mt-1 text-sm font-medium text-amber-600">
                          <Clock className="h-3.5 w-3.5 mr-1.5" />
                          Coming Soon
                        </div>
                      )}
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                        >
                          <Info className="h-4 w-4" />
                          <span className="sr-only">Info</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p>{type.description}</p>
                        {isComingSoon && <p className="text-amber-600 mt-2 font-medium">Coming Soon!</p>}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <CardDescription className="mt-4">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Use Cases:
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {type.useCases.map((useCase, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs font-medium py-1"
                        >
                          {useCase}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-6">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Features:
                  </span>
                  <ul className="mt-3 space-y-2.5">
                    {type.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <div
                          className={`rounded-full p-0.5 mr-2.5 mt-0.5 ${
                            selectedType === type.id || isAlreadySelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="pt-2 pb-6">
                <Button
                  className="w-full rounded-full"
                  variant={
                    selectedType === type.id
                      ? "default"
                      : isAlreadySelected
                      ? "secondary"
                      : isComingSoon
                      ? "outline"
                      : "outline"
                  }
                  onClick={() => handleSelect(type.id)}
                  size="lg"
                  disabled={isComingSoon}
                >
                  {selectedType === type.id
                    ? "Selected"
                    : isAlreadySelected
                    ? "Remove This Type"
                    : isComingSoon
                    ? "Coming Soon"
                    : "Select This Type"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {selectedType && (
        <Dialog
          open={!!selectedType}
          onOpenChange={() => setSelectedType(null)}
        >
          <DialogContent className="max-w-2xl mx-auto">
            <div className="text-center bg-muted/50 py-8 px-4 rounded-xl">
              {(() => {
                const selectedBookingType = bookingTypes.find(
                  (type) => type.id === selectedType
                );
                const isAlreadySelected = currentBookingTypes.includes(
                  selectedBookingType?.type || ""
                );

                return (
                  <>
                    <h3 className="text-xl font-medium mb-3">
                      {isAlreadySelected ? "Remove " : "Add "}
                      <span className="font-bold">
                        {selectedBookingType?.title}
                      </span>
                    </h3>
                    <p className="mb-6 text-muted-foreground">
                      {isAlreadySelected
                        ? "Are you sure you want to remove this booking type from your services?"
                        : "Great choice! Now you can customize this booking type to fit your specific business needs."}
                    </p>
                    <Button
                      size="lg"
                      className="rounded-full px-8"
                      onClick={handleSubmit}
                      variant={isAlreadySelected ? "destructive" : "default"}
                    >
                      {isAlreadySelected
                        ? "Remove Booking Type"
                        : "Continue Setup"}
                    </Button>
                    <p className="mt-3 text-sm text-muted-foreground">
                      You can manage your booking types at any time
                    </p>
                  </>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
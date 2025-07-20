import { useCallback, useState, useEffect } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Share2,
  MessageSquareText,
  Loader2,
  XCircle,
  CheckCircle,
} from "lucide-react";

const GET_USER_MANAGER = gql`
  query GetUserManager($userID: String!, $entityID: String) {
    getUserManager(userId: $userID, entityID: $entityID) {
      user {
        name
        number
        type
      }
      tempUser {
        password
      }
      book {
        id
        pickUpAddress
        deliveryAddress
        status
      }
    }
  }
`;

const SMS_MESSAGE_BOOK = gql`
  mutation SmsMessageBook($input: smsInput!) {
    smsMessageBook(input: $input) {
      id
      number
      message
      status
      createdAt
    }
  }
`;

const CHECK_SMS_MESSAGE_BOOK = gql`
  query GetSms($entityId: String, $number: String!) {
    getSms(number: $number, entityId: $entityId) {
      id
      number
      message
      status
      createdAt
    }
  }
`;

interface BookingShareDialogProps {
  userId: string;
  open?: boolean;
  onClose?: () => void;
  entityID?: string;
  serviceProvider?: string | null;
}

export default function BookingShareDialog({
  userId,
  open,
  entityID,
  onClose,
  serviceProvider,
}: BookingShareDialogProps) {
  const [smsStatus, setSmsStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [smsError, setSmsError] = useState<string>("");
  const [smsId, setSmsId] = useState<string>("");

  const { data, loading, error, refetch } = useQuery(GET_USER_MANAGER, {
    variables: { userID: userId, entityID },
    skip: !userId,
  });

  console.log("userId and entityID:", userId, entityID);

  const user = data?.getUserManager?.user;
  const tempUser = data?.getUserManager?.tempUser;
  const book = data?.getUserManager?.book;

  // Format phone number
  const formattedNumber =
    user?.number && user.number.startsWith("0")
      ? "233" + user.number.slice(1)
      : user?.number;

  // Query to check if SMS has already been sent for this number + entityID
  const { 
    data: smsData, 
    loading: smsLoading,
    refetch: refetchSms 
  } = useQuery(CHECK_SMS_MESSAGE_BOOK, {
    variables: { 
      entityId: entityID || book?.id, 
      number: user?.number 
    },
    skip: !user?.number || !entityID,
    fetchPolicy: 'cache-and-network' // Always check for latest data
  });

  // Check if SMS was already sent
  const existingSms = smsData?.getSms;
  const hasExistingSms = existingSms && (
    Array.isArray(existingSms) ? existingSms.length > 0 : true
  );
  const existingSmsStatus = hasExistingSms 
    ? (Array.isArray(existingSms) ? existingSms[0]?.status : existingSms?.status)
    : null;

  const [sendSmsMessage] = useMutation(SMS_MESSAGE_BOOK, {
    onCompleted: (data) => {
      if (data.smsMessageBook.status === "sent") {
        setSmsStatus("sent");
        setSmsError("");
        // Refetch to update the existing SMS check
        refetchSms();
      } else {
        setSmsStatus("error");
        setSmsError("Failed to send SMS");
      }
    },
    onError: (error) => {
      setSmsStatus("error");
      setSmsError(error.message);
    },
  });

  const generateMessage = useCallback(() => {
    if (!book || !tempUser) return "";

    const bookingLink = `https://winnemart.com/bookings/${book.id}`;
    const customerName = user?.name || "Customer";

    return `🎉 Booking Confirmation from ${
      serviceProvider
    } to ${customerName}

📋 Booking Details:
    
• Password: ${tempUser.password}
• Pickup: ${book.pickUpAddress}
• Delivery: ${book.deliveryAddress}
• Status: ${book.status || "Confirmed"}

🔗 View booking: ${bookingLink}

Thank you for choosing our service!`;
  }, [book, tempUser, user, serviceProvider]);

  const handleShareWhatsApp = () => {
    const message = generateMessage();
    if (message) {
      const encodedMessage = encodeURIComponent(message);
      const phone = formattedNumber || "";
      const url = phone
        ? `https://wa.me/${phone}?text=${encodedMessage}`
        : `https://wa.me/?text=${encodedMessage}`;
      window.open(url, "_blank");
    }
  };

  const handleShareSMS = async () => {
    if (!user?.number || !book || !tempUser) {
      setSmsError("Missing required information");
      setSmsStatus("error");
      return;
    }

    setSmsStatus("sending");
    setSmsError("");

    const message = generateMessage();

    try {
      await sendSmsMessage({
        variables: {
          input: {
            number: user.number,
            message: message,
            entityId: entityID || book.id,
            entityType: "booking",
            userId: userId,
          },
        },
      });
    } catch (error) {
      console.error("SMS sending error:", error);
    }
  };

  const handleCheckSmsStatus = async () => {
    if (!user?.number) return;
    
    try {
      await refetchSms();
    } catch (error) {
      console.error("Failed to check SMS status:", error);
    }
  };

  const handleRetry = () => {
    refetch();
    setSmsStatus("idle");
    setSmsError("");
  };

  const resetSmsStatus = () => {
    setSmsStatus("idle");
    setSmsError("");
  };

  // Clean up when dialog closes
  useEffect(() => {
    if (!open) {
      setSmsStatus("idle");
      setSmsError("");
    }
  }, [open]);

  // Determine if booking is confirmed (either booking exists or SMS was sent successfully)
  const isBookingConfirmed = (book && tempUser) || smsStatus === "sent";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Booking Confirmation
          </DialogTitle>
          <DialogDescription>
            {loading && (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Fetching booking details...
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-red-500">
                <XCircle className="h-4 w-4" />
                {error.message}
              </div>
            )}
            {!loading && !error && isBookingConfirmed && (
              <div className="space-y-2">
                <div className="text-green-600 font-medium">
                  ✅ Booking is confirmed!
                </div>
                <div className="text-sm text-gray-600">
                  Share this booking information with the customer
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Existing SMS Check */}
          {!loading && !error && hasExistingSms && smsStatus === "idle" && (
            <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
              <CheckCircle className="h-4 w-4" />
              SMS already sent for this booking ({existingSmsStatus})
            </div>
          )}

          {/* Booking Details */}
          {!loading && !error && book && tempUser && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-gray-900">Booking Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Password:</span>
                  <span className="ml-2 font-medium">{tempUser.password}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Pickup:</span>
                  <span className="ml-2 font-medium">{book.pickUpAddress}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Delivery:</span>
                  <span className="ml-2 font-medium">
                    {book.deliveryAddress}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Status:</span>
                  <span className="ml-2 font-medium">{book.status}</span>
                </div>
              </div>
            </div>
          )}

          {/* SMS Status Messages */}
          {smsLoading && smsStatus === "idle" && (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking SMS history...
            </div>
          )}

          {smsStatus === "sent" && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
              <CheckCircle className="h-4 w-4" />
              SMS sent successfully!
            </div>
          )}

          {smsStatus === "error" && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
              <XCircle className="h-4 w-4" />
              {smsError || "Failed to send SMS"}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {!loading && !error && book && tempUser && (
              <>
                <Button
                  onClick={handleShareWhatsApp}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share via WhatsApp
                </Button>
                <Button
                  onClick={handleShareSMS}
                  variant="outline"
                  className="w-full"
                  disabled={smsStatus === "sending"}
                >
                  {smsStatus === "sending" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending SMS...
                    </>
                  ) : hasExistingSms ? (
                    <>
                      <MessageSquareText className="mr-2 h-4 w-4" />
                      Resend SMS
                    </>
                  ) : (
                    <>
                      <MessageSquareText className="mr-2 h-4 w-4" />
                      Send SMS
                    </>
                  )}
                </Button>
                
                {/* Refresh SMS Status Button */}
                {hasExistingSms && (
                  <Button
                    onClick={handleCheckSmsStatus}
                    variant="outline"
                    className="w-full"
                    size="sm"
                    disabled={smsLoading}
                  >
                    {smsLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Refresh SMS Status
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
            {error && (
              <Button
                onClick={handleRetry}
                variant="outline"
                className="w-full"
              >
                <Loader2 className="mr-2 h-4 w-4" />
                Retry
              </Button>
            )}
            {smsStatus === "error" && (
              <Button
                onClick={resetSmsStatus}
                variant="outline"
                className="w-full"
                size="sm"
              >
                Try Again
              </Button>
            )}
          </div>
        </div>

        <DialogClose asChild>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
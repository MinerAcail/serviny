import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { gql, useMutation, useQuery } from "@apollo/client";

const JOB_REQUEST = gql`
  mutation jobRequest($serviceId: String!, $input: RidersRequestInput!) {
    jobRequest(serviceId: $serviceId, input: $input) {
      id
      termsConditions
      message
      state
      updatedAt
    }
  }
`;

const GET_JOB_RESPONSE = gql`
  query getjobResponse($serviceId: String!) {
    getjobResponse(serviceId: $serviceId) {
      id
      termsConditions
      message
      state
      updatedAt
    }
  }
`;

interface RiderRequest {
  id: string;
  riderId: string;
  termsConditions: boolean;
  message?: string;
  serviceId: string;
  state: string;
  createdAt: string;
  updatedAt: string;
}

export default function RiderRequest({
  children,
  serviceId,
}: {
  children: React.ReactNode;
  serviceId: string;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // GraphQL hooks
  const [submitJobRequest, { loading: submitting, error: submitError }] =
    useMutation(JOB_REQUEST, {
      refetchQueries: [{ query: GET_JOB_RESPONSE, variables: { serviceId } }],
    });

  const {
    data: jobResponse,
    // loading: fetchingResponse,
    // error: fetchError,
    // refetch,
  } = useQuery(GET_JOB_RESPONSE, {
    variables: { serviceId },
    skip: !serviceId,
    errorPolicy: "ignore", // Ignore "record not found" errors
  });

  const existingRequest = jobResponse?.getjobResponse;
  const hasActiveRequest = existingRequest && existingRequest.state !== "deleted";

 

  const handleSubmitRequest = async () => {
    if (!acceptedTerms) return;

    try {
      const response = await submitJobRequest({
        variables: {
          serviceId,
          input: {
            termsConditions: acceptedTerms,
            message: message.trim() || null,
            state: "pending", // Always set to pending for new/updated requests
          },
        },
      });

      if (response.data?.jobRequest) {
        setIsDialogOpen(false);
        resetForm();
        console.log(
          hasActiveRequest ? "Request updated successfully:" : "Request submitted successfully:",
          response.data.jobRequest
        );
      }
    } catch (error) {
      console.error("Error submitting request:", error);
    }
  };

  const handleDeleteRequest = async () => {
    if (!existingRequest) return;

    try {
      const response = await submitJobRequest({
        variables: {
          serviceId,
          input: {
            termsConditions: existingRequest.termsConditions,
            message: existingRequest.message,
            state: "deleted", // Set state to deleted
          },
        },
      });

      if (response.data?.jobRequest) {
        setIsDialogOpen(false);
        resetForm();
        console.log("Request deleted successfully:", response.data.jobRequest);
      }
    } catch (error) {
      console.error("Error deleting request:", error);
    }
  };

  const resetForm = () => {
    setMessage("");
    setAcceptedTerms(false);
  };

  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {hasActiveRequest ? "Update Rider Request" : "Submit Rider Request"}
          </DialogTitle>
          <DialogDescription>
            {hasActiveRequest
              ? "Update your existing rider request or withdraw it"
              : "Request to join as a rider for delivery services"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Show existing request status if available */}
          {hasActiveRequest && (
            <Card className={`border-2 ${
              existingRequest.state === "approved" 
                ? "border-green-200 bg-green-50" 
                : existingRequest.state === "rejected"
                ? "border-red-200 bg-red-50"
                : "border-blue-200 bg-blue-50"
            }`}>
              <CardHeader>
                <CardTitle className="text-sm">Current Request Status</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Status:{" "}
                  <span className={`font-medium capitalize ${
                    existingRequest.state === "approved" 
                      ? "text-green-600" 
                      : existingRequest.state === "rejected"
                      ? "text-red-600"
                      : "text-blue-600"
                  }`}>
                    {existingRequest.state}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Last updated:{" "}
                  {new Date(existingRequest.updatedAt).toLocaleDateString()}
                </p>
                {existingRequest.state === "approved" && (
                  <p className="text-sm text-green-600 mt-2">
                    🎉 Congratulations! Your request has been approved.
                  </p>
                )}
                {existingRequest.state === "rejected" && (
                  <p className="text-sm text-red-600 mt-2">
                    Your request was not approved. You can update and resubmit.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Form fields - always show for new requests or editable existing ones */}
          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add any additional information or requests here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={submitting || (existingRequest?.state === "approved")}
            />
          </div>

          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-sm">Terms & Conditions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <p>• You must be 18+ years old to join as a rider</p>
                <p>• Valid driver's license and insurance required</p>
                <p>• Background check may be required</p>
                <p>• Delivery fees and commission rates apply</p>
                <p>• You can revoke your request at any time before approval</p>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) =>
                    setAcceptedTerms(checked as boolean)
                  }
                  disabled={submitting || (existingRequest?.state === "approved")}
                />
                <Label htmlFor="terms" className="text-sm">
                  I accept the terms and conditions
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Error display */}
          {submitError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4">
                <p className="text-sm text-red-600">
                  {submitError.message || "An error occurred"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 order-2 sm:order-1">
            {hasActiveRequest && existingRequest.state !== "approved" && (
              <Button
                variant="destructive"
                onClick={handleDeleteRequest}
                disabled={submitting}
                size="sm"
              >
                {submitting ? "Deleting..." : "Withdraw Request"}
              </Button>
            )}
          </div>
          
          <div className="flex gap-2 order-1 sm:order-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitRequest}
              disabled={
                !acceptedTerms || 
                submitting || 
                (existingRequest?.state === "approved")
              }
            >
              {submitting 
                ? (hasActiveRequest ? "Updating..." : "Submitting...") 
                : (hasActiveRequest ? "Update Request" : "Submit Request")
              }
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  Clock,
  FileText,
  DollarSign,
  FileCheck,
  UserCheck,
  Receipt,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { NewCardForm, NewPolicyForm } from "./invoiceForms";
import {
  GET_PRICE_CARDS,
  GET_POLICY_INFORMATION,
  GET_INVOICE,
  GET_RIDERS,
  UPDATE_CARGO_WITH_RIDER,
  CREATE_CARGO_PRICE_CARD,
  CREATE_CARGO_POLICY,
  CREATE_INVOICE,
} from "./invoiceQueries";
import {
  PriceCardSelection,
  PolicyCardSelection,
} from "./InvoiceSelectionCards";
import { useNavigate } from "react-router";

// Type Definitions
interface ServiceData {
  id: string;
  type: "ORDER" | "BOOKING";
  serviceId: string;
  orderData?: {
    orderId?: string;
  };
  bookingData?: {
    bookingId?: string;
    cargoId?: string;
    status?: string;
    pickUpAddress?: string;
    deliveryAddress?: string;
    deliveryFee?: number;
  };
  rider?: {
    id: string;
    name: string;
    number: string;
  };
}

interface PriceCard {
  card: {
    id: string;
    title: string;
    description: string;
  };
  prices: Array<{
    id: string;
    label: string;
    value: string;
  }>;
  amenities: Array<{
    id: string;
    text: string;
  }>;
}

interface Policy {
  policy: {
    id: string;
    name: string;
    description: string;
  };
  policyDetails: Array<{
    id: string;
    title: string;
    content: string;
    listItems: string[];
  }>;
}

interface Rider {
  id: string;
  name: string;
  number: string;
  location: string;
  state: string;
}

interface Invoice {
  id: string;
  serviceId: string;
  cargoId: string;
  userId: string;
  notes?: string;
  policyId?: string;
  priceId?: string;
  createdAt: string;
  updatedAt: string;
}

interface InvoiceInput {
  cargoId?: string;
  notes?: string;
  policyId?: string;
  priceId?: string;
}

interface PriceCardInput {
  title: string;
  description: string;
  prices: Array<{
    label: string;
    value: string;
  }>;
  amenities: Array<{
    text: string;
  }>;
}

interface CreatePolicyInput {
  name: string;
  description: string;
  details: Array<{
    title: string;
    content: string;
    listItems: string[];
  }>;
}

interface PolicyDetailInput {
  title: string;
  content: string;
  listItems: string[];
}

interface PolicyInput {
  name: string;
  description: string;
  details: PolicyDetailInput[];
}

interface InvoiceManagementProps {
  booking: ServiceData | null;
}

export function InvoicePaymentStatusSectionAssigned({
  booking,
}: InvoiceManagementProps) {
  // State for dialogs and selections
  const navigate = useNavigate();
  const [selectedRider, setSelectedRider] = useState<string>("");
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showRiderDialog, setShowRiderDialog] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showInvoiceViewDialog, setShowInvoiceViewDialog] = useState(false);
  const [showCreatePriceDialog, setShowCreatePriceDialog] = useState(false);
  const [showCreatePolicyDialog, setShowCreatePolicyDialog] = useState(false);
  // Invoice creation state
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [selectedInvoicePriceCard, setSelectedInvoicePriceCard] =
    useState<string>("");
  const [selectedInvoicePolicy, setSelectedInvoicePolicy] =
    useState<string>("");

  // New price card form state
  const [newPriceCardData, setNewPriceCardData] = useState<PriceCardInput>({
    title: "",
    description: "",
    prices: [{ label: "Price:", value: "0" }],
    amenities: [{ text: "Amenity" }],
  });

  // New policy form state
  const [newPolicyData, setNewPolicyData] = useState<PolicyInput>({
    name: "",
    description: "",
    details: [
      { title: "General", content: "Policy details here", listItems: [] },
    ],
  });

  // GraphQL queries
  const {
    data: priceCardsData,
    // loading: priceCardsLoading,
    refetch: refetchPriceCards,
  } = useQuery(GET_PRICE_CARDS, {
    variables: { serviceId: booking?.serviceId },
    skip: !booking?.serviceId,
  });

  const {
    data: policiesData,
    // loading: policiesLoading,
    refetch: refetchPolicies,
  } = useQuery(GET_POLICY_INFORMATION, {
    variables: { ServiceID: booking?.serviceId },
    skip: !booking?.serviceId,
  });

  const { data: ridersData } = useQuery(GET_RIDERS);

  const {
    data: invoiceData,
    loading: invoiceLoading,
    refetch: refetchInvoice,
  } = useQuery(GET_INVOICE, {
    variables: { cargoId: booking?.bookingData?.cargoId },
    skip: !booking?.bookingData?.cargoId,
  });

  // Mutations
  const [updateCargoWithRider, { loading: updatingRider }] = useMutation(
    UPDATE_CARGO_WITH_RIDER,
    {
      onCompleted: () => {
        toast.success("Rider assigned successfully!");
        setShowRiderDialog(false);
        setSelectedRider("");
      },
      onError: (error) => {
        toast.error(`Failed to assign rider: ${error.message}`);
      },
    }
  );

  const [createCargoPriceCard, { loading: creatingPriceCard }] = useMutation(
    CREATE_CARGO_PRICE_CARD,
    {
      onCompleted: () => {
        toast.success("Price card created successfully!");
        setShowCreatePriceDialog(false);
        setNewPriceCardData({
          title: "",
          description: "",
          prices: [{ label: "Price:", value: "0" }],
          amenities: [{ text: "Amenity" }],
        });
        refetchPriceCards();
      },
      onError: (error) => {
        toast.error(`Failed to create price card: ${error.message}`);
      },
    }
  );

  const [createCargoPolicy, { loading: creatingPolicy }] = useMutation(
    CREATE_CARGO_POLICY,
    {
      onCompleted: () => {
        toast.success("Policy created successfully!");
        setShowCreatePolicyDialog(false);
        setNewPolicyData({
          name: "",
          description: "",
          details: [
            { title: "General", content: "Policy details here", listItems: [] },
          ],
        });
        refetchPolicies();
      },
      onError: (error) => {
        toast.error(`Failed to create policy: ${error.message}`);
      },
    }
  );

  const [createInvoice, { loading: creatingInvoice }] = useMutation(
    CREATE_INVOICE,
    {
      onCompleted: () => {
        toast.success("Invoice created successfully!");
        setShowInvoiceDialog(false);
        setInvoiceNotes("");
        setSelectedInvoicePriceCard("");
        setSelectedInvoicePolicy("");
        refetchInvoice();
      },
      onError: (error) => {
        toast.error(`Failed to create invoice: ${error.message}`);
      },
    }
  );

  if (!booking) return null;

  const isCargoBooking =
    booking.type === "BOOKING" && booking.bookingData?.cargoId;
  const priceCards: PriceCard[] =
    priceCardsData?.getpriceCardsinformation || [];
  const policies: Policy[] = policiesData?.getPolicyInformation || [];
  const riders: Rider[] = ridersData?.riders || [];
  const invoice: Invoice | null = invoiceData?.getInvoice || null;

  // Event handlers
  const handleAssignRider = () => {
    if (!booking?.bookingData?.cargoId || !selectedRider) {
      toast.error("Please select a rider");
      return;
    }

    updateCargoWithRider({
      variables: {
        riderId: selectedRider,
        cargoId: booking.bookingData.cargoId,
      },
    });
  };

  const handleCreateInvoice = () => {
    if (!booking?.bookingData?.cargoId) {
      toast.error("No cargo booking found");
      return;
    }

    const invoiceInput: InvoiceInput = {
      cargoId: booking.bookingData.cargoId,
      notes: invoiceNotes || undefined,
      policyId: selectedInvoicePolicy || undefined,
      priceId: selectedInvoicePriceCard || undefined,
    };

    createInvoice({
      variables: { input: invoiceInput },
    });
  };

  const handleCreateNewPriceCard = () => {
    if (!booking?.bookingData?.cargoId) {
      toast.error("No cargo booking found");
      return;
    }

    createCargoPriceCard({
      variables: {
        input: newPriceCardData,
        cargoId: booking.bookingData.cargoId,
      },
    });
  };

  const handleCreateNewPolicy = () => {
    if (!booking?.bookingData?.cargoId) {
      toast.error("No cargo booking found");
      return;
    }

    const input: CreatePolicyInput = {
      name: newPolicyData.name,
      description: newPolicyData.description,
      details: newPolicyData.details,
    };

    createCargoPolicy({
      variables: {
        input,
        cargoId: booking.bookingData.cargoId,
      },
    });
  };

  // Form handlers for new price card
  const updateNewPriceCardField = (
    field: keyof PriceCardInput,
    value:
      | string
      | { label: string; value: string }[]
      | { text: string }[]
      | undefined
  ) => {
    setNewPriceCardData({ ...newPriceCardData, [field]: value });
  };

  const addNewPriceCardPrice = () => {
    updateNewPriceCardField("prices", [
      ...newPriceCardData.prices,
      { label: "New Price:", value: "0" },
    ]);
  };

  const updateNewPriceCardPrice = (
    index: number,
    field: keyof { label: string; value: string },
    value: string
  ) => {
    const updatedPrices = [...newPriceCardData.prices];
    updatedPrices[index] = { ...updatedPrices[index], [field]: value };
    updateNewPriceCardField("prices", updatedPrices);
  };

  const removeNewPriceCardPrice = (index: number) => {
    const updatedPrices = newPriceCardData.prices.filter((_, i) => i !== index);
    updateNewPriceCardField("prices", updatedPrices);
  };

  const addNewPriceCardAmenity = () => {
    updateNewPriceCardField("amenities", [
      ...newPriceCardData.amenities,
      { text: "New Amenity" },
    ]);
  };

  const updateNewPriceCardAmenity = (index: number, value: string) => {
    const updatedAmenities = [...newPriceCardData.amenities];
    updatedAmenities[index] = { ...updatedAmenities[index], text: value };
    updateNewPriceCardField("amenities", updatedAmenities);
  };

  const removeNewPriceCardAmenity = (index: number) => {
    const updatedAmenities = newPriceCardData.amenities.filter(
      (_, i) => i !== index
    );
    updateNewPriceCardField("amenities", updatedAmenities);
  };

  // Form handlers for new policy
  const updateNewPolicyField = (
    field: keyof PolicyInput,
    value: string | PolicyDetailInput[]
  ) => {
    setNewPolicyData({ ...newPolicyData, [field]: value });
  };

  const addNewPolicyDetail = () => {
    updateNewPolicyField("details", [
      ...newPolicyData.details,
      { title: "New Section", content: "Policy details here", listItems: [] },
    ]);
  };

  const updateNewPolicyDetail = (
    index: number,
    field: keyof PolicyDetailInput,
    value: string | string[]
  ) => {
    const updatedDetails = [...newPolicyData.details];
    updatedDetails[index] = { ...updatedDetails[index], [field]: value };
    updateNewPolicyField("details", updatedDetails);
  };

  const removeNewPolicyDetail = (index: number) => {
    const updatedDetails = newPolicyData.details.filter((_, i) => i !== index);
    updateNewPolicyField("details", updatedDetails);
  };

  return (
    <div className="mt-6 pt-6 border-t border-white/30">
      {/* Cargo Booking Overview Card */}

      {invoice ? (
        <Button
          onClick={() => navigate(`/invoice/${booking.bookingData?.cargoId}`)}
          variant="outline"
          className="h-12 rounded-xl backdrop-blur-sm bg-blue-100  border-white/30 hover:bg-white/80 hover:shadow-lg transition-all duration-300"
        >
          <FileText className="h-4 w-4 mr-2 text-gray-600" />
          <span className="font-semibold">{"View Invoice"}</span>
        </Button>
      ) : (
        <Button
          onClick={() => setShowBookingDialog(!showBookingDialog)}
          variant="outline"
          className="h-12 rounded-xl backdrop-blur-sm bg-blue-100  border-white/30 hover:bg-white/80 hover:shadow-lg transition-all duration-300"
        >
          <FileText className="h-4 w-4 mr-2 text-gray-600" />
          <span className="font-semibold">Add Invoice</span>
        </Button>
      )}

      {isCargoBooking && (
        <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
          <DialogTrigger asChild></DialogTrigger>

          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto backdrop-blur-2xl bg-white/95 border-white/30 rounded-3xl">
            <div className="space-y-6">
              {/* STEP 1: Price Cards & Policies Management */}
              <div className="p-6 rounded-2xl backdrop-blur-sm bg-gradient-to-br from-purple-50/60 to-pink-50/40 border border-white/20">
                <h5 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="bg-purple-500 text-white text-sm font-bold px-2 py-1 rounded-full">
                    1
                  </span>
                  Setup Price Cards & Policies
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Create Price Card */}
                  <Dialog
                    open={showCreatePriceDialog}
                    onOpenChange={setShowCreatePriceDialog}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-12 rounded-xl backdrop-blur-sm bg-white/60 border-white/30 hover:bg-white/80 hover:shadow-lg transition-all duration-300"
                      >
                        <DollarSign className="h-5 w-5 mr-3 text-green-600" />
                        <span className="font-semibold">Create Price Card</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto backdrop-blur-2xl bg-white/95 border-white/30 rounded-3xl">
                      <DialogHeader className="pb-4">
                        <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          <DollarSign className="h-6 w-6 text-green-600" />
                          Create New Price Card
                        </DialogTitle>
                      </DialogHeader>
                      <NewCardForm
                        formData={newPriceCardData}
                        updateField={updateNewPriceCardField}
                        addPrice={addNewPriceCardPrice}
                        updatePrice={updateNewPriceCardPrice}
                        removePrice={removeNewPriceCardPrice}
                        addAmenity={addNewPriceCardAmenity}
                        updateAmenity={updateNewPriceCardAmenity}
                        removeAmenity={removeNewPriceCardAmenity}
                      />
                      <DialogFooter className="pt-4 border-t border-white/20">
                        <Button
                          variant="outline"
                          onClick={() => setShowCreatePriceDialog(false)}
                          className="rounded-xl backdrop-blur-sm bg-white/60 border-white/30"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreateNewPriceCard}
                          disabled={creatingPriceCard}
                          className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                        >
                          {creatingPriceCard ? (
                            <>
                              <Clock className="h-4 w-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Create Price Card
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Create Policy */}
                  <Dialog
                    open={showCreatePolicyDialog}
                    onOpenChange={setShowCreatePolicyDialog}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-12 rounded-xl backdrop-blur-sm bg-white/60 border-white/30 hover:bg-white/80 hover:shadow-lg transition-all duration-300"
                      >
                        <FileCheck className="h-5 w-5 mr-3 text-purple-600" />
                        <span className="font-semibold">Create Policy</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto backdrop-blur-2xl bg-white/95 border-white/30 rounded-3xl">
                      <DialogHeader className="pb-4">
                        <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          <FileCheck className="h-6 w-6 text-purple-600" />
                          Create New Policy
                        </DialogTitle>
                      </DialogHeader>
                      <NewPolicyForm
                        formData={newPolicyData}
                        updateField={updateNewPolicyField}
                        addDetail={addNewPolicyDetail}
                        updateDetail={updateNewPolicyDetail}
                        removeDetail={removeNewPolicyDetail}
                      />
                      <DialogFooter className="pt-4 border-t border-white/20">
                        <Button
                          variant="outline"
                          onClick={() => setShowCreatePolicyDialog(false)}
                          className="rounded-xl backdrop-blur-sm bg-white/60 border-white/30"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreateNewPolicy}
                          disabled={creatingPolicy}
                          className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        >
                          {creatingPolicy ? (
                            <>
                              <Clock className="h-4 w-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Create Policy
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* STEP 2: Rider Assignment */}
              <div className="p-6 rounded-2xl backdrop-blur-sm bg-gradient-to-br from-blue-50/60 to-indigo-50/40 border border-white/20">
                <h5 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="bg-blue-500 text-white text-sm font-bold px-2 py-1 rounded-full">
                    2
                  </span>
                  Assign Rider (Optional)
                </h5>
                <Dialog
                  open={showRiderDialog}
                  onOpenChange={setShowRiderDialog}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-12 rounded-xl backdrop-blur-sm bg-white/60 border-white/30 hover:bg-white/80 hover:shadow-lg transition-all duration-300"
                    >
                      <UserCheck className="h-5 w-5 mr-3 text-blue-600" />
                      <span className="font-semibold">
                        {booking.rider ? "Change Rider" : "Assign Rider"}
                      </span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md backdrop-blur-2xl bg-white/95 border-white/30 rounded-3xl">
                    <DialogHeader className="pb-4">
                      <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <UserCheck className="h-6 w-6 text-blue-600" />
                        Assign Rider
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Select
                        value={selectedRider}
                        onValueChange={setSelectedRider}
                      >
                        <SelectTrigger className="rounded-xl backdrop-blur-sm bg-white/60 border-white/30">
                          <SelectValue placeholder="Choose a rider" />
                        </SelectTrigger>
                        <SelectContent className="backdrop-blur-xl bg-white/95 border-white/30 rounded-2xl">
                          {riders.map((rider) => (
                            <SelectItem
                              key={rider.id}
                              value={rider.id}
                              className="rounded-xl"
                            >
                              {rider.name} - {rider.location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {selectedRider && (
                        <div className="p-4 rounded-2xl backdrop-blur-sm bg-gradient-to-br from-blue-50/60 to-cyan-50/40 border border-white/20">
                          <h4 className="font-bold mb-3 text-gray-800">
                            Rider Details:
                          </h4>
                          {(() => {
                            const rider = riders.find(
                              (r) => r.id === selectedRider
                            );
                            return rider ? (
                              <div className="space-y-2 text-sm">
                                <p className="text-gray-700">
                                  <span className="font-semibold">Name:</span>{" "}
                                  {rider.name}
                                </p>
                                <p className="text-gray-700">
                                  <span className="font-semibold">Phone:</span>{" "}
                                  {rider.number}
                                </p>
                                <p className="text-gray-700">
                                  <span className="font-semibold">
                                    Location:
                                  </span>{" "}
                                  {rider.location}
                                </p>
                                <p className="text-gray-700 flex items-center gap-2">
                                  <span className="font-semibold">Status:</span>
                                  <Badge
                                    variant="outline"
                                    className="bg-white/60 border-white/30 rounded-full"
                                  >
                                    {rider.state}
                                  </Badge>
                                </p>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      )}

                      <Button
                        onClick={handleAssignRider}
                        disabled={!selectedRider || updatingRider}
                        className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                      >
                        {updatingRider ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Assigning...
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Assign Rider
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* STEP 3: Invoice Management */}
              <div className="flex gap-3">
                {!invoice && (
                  <Dialog
                    open={showInvoiceDialog}
                    onOpenChange={setShowInvoiceDialog}
                  >
                    <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto backdrop-blur-2xl bg-white/95 border-white/30 rounded-3xl">
                      <DialogHeader className="pb-4">
                        <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          <Receipt className="h-6 w-6 text-emerald-600" />
                          Create Invoice for Cargo #
                          {booking.bookingData?.cargoId?.slice(-6)}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6">
                        {/* Invoice Notes */}
                        <div className="p-4 rounded-2xl backdrop-blur-sm bg-gradient-to-br from-gray-50/60 to-white/40 border border-white/20">
                          <Label
                            htmlFor="invoice-notes"
                            className="text-sm font-semibold text-gray-800 mb-2 block"
                          >
                            Invoice Notes
                          </Label>
                          <Textarea
                            id="invoice-notes"
                            placeholder="Add any notes for this invoice..."
                            value={invoiceNotes}
                            onChange={(e) => setInvoiceNotes(e.target.value)}
                            rows={3}
                            className="backdrop-blur-sm bg-white/60 border-white/30 rounded-xl focus:bg-white/80 transition-all duration-200"
                          />
                        </div>

                        {/* Price Card Selection */}
                        <div>
                          <Label className="text-lg font-bold text-gray-800 mb-4 block">
                            Select Price Card (Optional)
                          </Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {priceCards.map((priceCard) => (
                              <PriceCardSelection
                                key={priceCard.card.id}
                                priceCard={priceCard}
                                isSelected={
                                  selectedInvoicePriceCard === priceCard.card.id
                                }
                                onSelect={() =>
                                  setSelectedInvoicePriceCard(
                                    selectedInvoicePriceCard ===
                                      priceCard.card.id
                                      ? ""
                                      : priceCard.card.id
                                  )
                                }
                              />
                            ))}
                          </div>
                          {priceCards.length === 0 && (
                            <div className="p-4 rounded-2xl backdrop-blur-sm bg-yellow-50/60 border border-yellow-200/50 text-center">
                              <p className="text-sm text-yellow-700 font-medium">
                                No price cards available. Create one first!
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Policy Selection */}
                        <div>
                          <Label className="text-lg font-bold text-gray-800 mb-4 block">
                            Select Policy (Optional)
                          </Label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {policies.map((policy) => (
                              <PolicyCardSelection
                                key={policy.policy.id}
                                policy={policy}
                                isSelected={
                                  selectedInvoicePolicy === policy.policy.id
                                }
                                onSelect={() =>
                                  setSelectedInvoicePolicy(
                                    selectedInvoicePolicy === policy.policy.id
                                      ? ""
                                      : policy.policy.id
                                  )
                                }
                              />
                            ))}
                          </div>
                          {policies.length === 0 && (
                            <div className="p-4 rounded-2xl backdrop-blur-sm bg-yellow-50/60 border border-yellow-200/50 text-center">
                              <p className="text-sm text-yellow-700 font-medium">
                                No policies available. Create one first!
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <DialogFooter className="pt-6 border-t border-white/20">
                        <Button
                          variant="outline"
                          onClick={() => setShowInvoiceDialog(false)}
                          className="rounded-xl backdrop-blur-sm bg-white/60 border-white/30"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreateInvoice}
                          disabled={creatingInvoice}
                          className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                        >
                          {creatingInvoice ? (
                            <>
                              <Clock className="h-4 w-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Create Invoice
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            <DialogFooter className="pt-6 border-t border-white/20">
              <Button
                variant="outline"
                onClick={() => setShowBookingDialog(false)}
                className="rounded-xl backdrop-blur-sm bg-white/60 border-white/30"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Invoice View Dialog */}
      <Dialog
        open={showInvoiceViewDialog}
        onOpenChange={setShowInvoiceViewDialog}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto backdrop-blur-2xl bg-white/95 border-white/30 rounded-3xl">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Receipt className="h-6 w-6 text-emerald-600" />
              Invoice for Cargo #{booking.bookingData?.cargoId?.slice(-6)}
            </DialogTitle>
          </DialogHeader>

          {invoiceLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Clock className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-500" />
                <p className="text-gray-600 font-medium">Loading invoice...</p>
              </div>
            </div>
          ) : invoice ? (
            <div className="space-y-6">
              <Card className="backdrop-blur-sm bg-gradient-to-br from-white/60 to-gray-50/40 border-white/20 rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Receipt className="h-5 w-5 text-emerald-600" />
                    Invoice Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl backdrop-blur-sm bg-white/40 border border-white/20">
                      <Label className="text-sm font-semibold text-gray-800">
                        Invoice ID
                      </Label>
                      <p className="text-sm text-gray-600 font-mono">
                        {invoice.id}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl backdrop-blur-sm bg-white/40 border border-white/20">
                      <Label className="text-sm font-semibold text-gray-800">
                        Created At
                      </Label>
                      <p className="text-sm text-gray-600">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl backdrop-blur-sm bg-white/40 border border-white/20">
                      <Label className="text-sm font-semibold text-gray-800">
                        Service ID
                      </Label>
                      <p className="text-sm text-gray-600 font-mono">
                        {invoice.serviceId}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl backdrop-blur-sm bg-white/40 border border-white/20">
                      <Label className="text-sm font-semibold text-gray-800">
                        User ID
                      </Label>
                      <p className="text-sm text-gray-600 font-mono">
                        {invoice.userId}
                      </p>
                    </div>
                  </div>
                  {invoice.notes && (
                    <div className="p-4 rounded-xl backdrop-blur-sm bg-blue-50/60 border border-blue-200/50">
                      <Label className="text-sm font-semibold text-gray-800">
                        Notes
                      </Label>
                      <p className="text-sm text-gray-700 mt-1">
                        {invoice.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="p-4 rounded-2xl backdrop-blur-sm bg-gray-50/60 border border-gray-200/50 inline-block">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold mb-2 text-gray-800">
                  No Invoice Found
                </h3>
                <p className="text-gray-600 mb-4 max-w-md">
                  This cargo doesn't have an invoice yet. Create price cards and
                  policies first, then create an invoice.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-white/20">
            <Button
              variant="outline"
              onClick={() => setShowInvoiceViewDialog(false)}
              className="rounded-xl backdrop-blur-sm bg-white/60 border-white/30"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

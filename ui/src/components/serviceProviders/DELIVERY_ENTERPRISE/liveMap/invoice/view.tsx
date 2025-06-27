"use client";

import type React from "react";
import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import {
  FileText,
  User,
  Truck,
  Clock,
  CheckCircle,
  Download,
  PrinterIcon as Print,
  Share,
  DollarSign,
  Star,
  Calculator,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useParams } from "react-router";

// GraphQL Query
const GET_FULL_INVOICE = gql`
  query GetFullInvoice($cargoId: String!) {
    getFullInvoice(cargoId: $cargoId) {
      price {
        card {
          id
          title
          description
        }
        prices {
          id
          label
          value
        }
        amenities {
          id
          text
        }
      }
      policy {
        policy {
          id
          name
          description
        }
        policyDetails {
          id
          title
          content
          listItems
        }
      }
      customer {
        id
        name
        dpfile
      }
      cargo {
        id
        transportType
        bookingId
      }
    }
  }
`;

// Type Definitions
interface Price {
  id: string;
  label: string;
  value: string;
}

interface Amenity {
  id: string;
  text: string;
}

interface PriceCard {
  card: {
    id: string;
    title: string;
    description: string;
  };
  prices: Price[];
  amenities: Amenity[];
}

interface PolicyDetail {
  id: string;
  title: string;
  content: string;
  listItems: string[] | null;
}

interface PolicyItem {
  policy: {
    id: string;
    name: string;
    description: string;
  };
  policyDetails: PolicyDetail[];
}

interface Customer {
  id: string;
  name: string;
  dpfile: string;
}

interface Cargo {
  id: string;
  transportType: string;
  bookingId: string;
}

interface FullInvoiceData {
  price: PriceCard[];
  policy: PolicyItem[];
  customer: Customer;
  cargo: Cargo;
}

const FullInvoiceDocument: React.FC = () => {
  const { cargoId } = useParams<{ cargoId: string }>();
  const { data, loading, error } = useQuery(GET_FULL_INVOICE, {
    variables: { cargoId },
  });

  const invoiceData: FullInvoiceData | null = data?.getFullInvoice || null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Loading Invoice
          </h3>
          <p className="text-gray-600">
            Please wait while we prepare your document...
          </p>
        </div>
      </div>
    );
  }

  if (error || !invoiceData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center p-8 rounded-2xl backdrop-blur-sm bg-white/60 border border-white/30">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Invoice #{cargoId?.slice(-6)} Not Found
          </h3>
          <p className="text-gray-600 mb-4">Contact the service Provider</p>
        </div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const customerInitials = invoiceData.customer.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  // Calculate totals from all price cards
  const calculateTotals = () => {
    let subtotal = 0;
    let totalItems = 0;

    invoiceData.price.forEach((priceCard) => {
      priceCard.prices.forEach((price) => {
        subtotal += Number.parseFloat(price.value) || 0;
        totalItems += 1;
      });
    });

    const tax = subtotal * 0.15; // 15% tax
    const total = subtotal + tax;

    return { subtotal, tax, total, totalItems };
  };

  const { subtotal, tax, total, totalItems } = calculateTotals();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Cargo Invoice
              </h1>
              <p className="text-sm text-gray-600">
                Document #{invoiceData.cargo.id.slice(-8)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl backdrop-blur-sm bg-white/60 border-white/30 hover:bg-white/80"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl backdrop-blur-sm bg-white/60 border-white/30 hover:bg-white/80"
            >
              <Print className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl backdrop-blur-sm bg-white/60 border-white/30 hover:bg-white/80"
            >
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Invoice Document */}
        <Card className="backdrop-blur-2xl bg-white/90 border-white/30 shadow-2xl shadow-blue-500/10 rounded-3xl overflow-hidden">
          {/* Document Header */}
          <CardHeader className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border-b border-white/20 p-8">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  CARGO INVOICE
                </h2>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    <span className="font-semibold">Invoice Date:</span>{" "}
                    {currentDate}
                  </p>
                  <p>
                    <span className="font-semibold">Cargo ID:</span>{" "}
                    {invoiceData.cargo.id}
                  </p>
                  <p>
                    <span className="font-semibold">Booking ID:</span>{" "}
                    {invoiceData.cargo.bookingId}
                  </p>
                  <p>
                    <span className="font-semibold">Transport Type:</span>
                    <Badge
                      variant="outline"
                      className="ml-2 bg-white/60 border-white/30 rounded-full"
                    >
                      {invoiceData.cargo.transportType}
                    </Badge>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="p-4 rounded-2xl backdrop-blur-sm bg-gradient-to-br from-green-50/60 to-emerald-50/40 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-800">
                      CONFIRMED
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Status: Active</p>
                  <div className="mt-2 pt-2 border-t border-green-200/50">
                    <p className="text-lg font-bold text-green-700">
                      GH₵{total.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-600">Total Amount</p>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-8 space-y-8">
            {/* Customer and Cargo Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Customer Information */}
              <div className="p-6 rounded-2xl backdrop-blur-sm bg-gradient-to-br from-blue-50/60 to-cyan-50/40 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-blue-500/20">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">
                    Customer Information
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-white/50">
                      <AvatarImage
                        src={invoiceData.customer.dpfile || "/placeholder.svg"}
                        alt={invoiceData.customer.name}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-bold">
                        {customerInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-base font-bold text-gray-900">
                        {invoiceData.customer.name}
                      </p>
                      <p className="text-sm text-gray-600 font-mono">
                        {invoiceData.customer.id}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cargo Information */}
              <div className="p-6 rounded-2xl backdrop-blur-sm bg-gradient-to-br from-purple-50/60 to-pink-50/40 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-purple-500/20">
                    <Truck className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">
                    Cargo Details
                  </h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      Cargo ID
                    </p>
                    <p className="text-sm text-gray-600 font-mono">
                      {invoiceData.cargo.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      Booking Reference
                    </p>
                    <p className="text-sm text-gray-600 font-mono">
                      {invoiceData.cargo.bookingId}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      Transport Method
                    </p>
                    <Badge
                      variant="outline"
                      className="bg-white/60 border-white/30 rounded-full"
                    >
                      {invoiceData.cargo.transportType}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-gradient-to-r from-transparent via-gray-300/50 to-transparent" />

            {/* Pricing Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Pricing & Services
                  </h3>
                  <p className="text-sm text-gray-600">
                    Detailed breakdown of charges ({invoiceData.price.length}{" "}
                    price {invoiceData.price.length === 1 ? "card" : "cards"})
                  </p>
                </div>
              </div>

              {/* Price Cards */}
              <div className="space-y-6">
                {invoiceData.price.map((priceCard, cardIndex) => (
                  <div key={priceCard.card.id} className="space-y-4">
                    {/* Price Card Header */}
                    <div className="p-6 rounded-2xl backdrop-blur-sm bg-gradient-to-br from-green-50/60 to-emerald-50/40 border border-white/20">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-sm font-bold">
                          {cardIndex + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-800 mb-2">
                            {priceCard.card.title}
                          </h4>
                          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                            {priceCard.card.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Prices */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-4">
                      {priceCard.prices.map((price) => (
                        <div
                          key={price.id}
                          className="p-4 rounded-xl backdrop-blur-sm bg-white/40 border border-white/20"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                {price.label}
                              </p>
                              <p className="text-xs text-gray-600">
                                Service charge
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-green-600">
                                GH₵{price.value}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Amenities */}
                    {priceCard.amenities.length > 0 && (
                      <div className="ml-4 p-4 rounded-xl backdrop-blur-sm bg-gradient-to-br from-yellow-50/60 to-orange-50/40 border border-white/20">
                        <div className="flex items-center gap-2 mb-3">
                          <Star className="h-4 w-4 text-yellow-600" />
                          <h5 className="text-sm font-bold text-gray-800">
                            Included Amenities
                          </h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {priceCard.amenities.map((amenity) => (
                            <div
                              key={amenity.id}
                              className="flex items-center gap-2 text-sm text-gray-700"
                            >
                              <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                              <span>{amenity.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Invoice Summary */}
              <div className="p-6 rounded-2xl backdrop-blur-sm bg-gradient-to-br from-gray-50/60 to-white/40 border border-white/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-gray-500/20">
                    <Calculator className="h-5 w-5 text-gray-600" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-800">
                    Invoice Summary
                  </h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">
                      Subtotal ({totalItems} items)
                    </span>
                    <span className="font-semibold text-gray-900">
                      GH₵{subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">Tax (15%)</span>
                    <span className="font-semibold text-gray-900">
                      GH₵{tax.toFixed(2)}
                    </span>
                  </div>
                  <Separator className="bg-gray-300/50" />
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800">
                      Total Amount
                    </span>
                    <span className="text-2xl font-bold text-green-600">
                      GH₵{total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-gradient-to-r from-transparent via-gray-300/50 to-transparent" />

            {/* Policy Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Policies & Terms
                  </h3>
                  <p className="text-sm text-gray-600">
                    Service agreements and conditions (
                    {invoiceData.policy.length}{" "}
                    {invoiceData.policy.length === 1 ? "policy" : "policies"})
                  </p>
                </div>
              </div>

              {/* All Policies */}
              <div className="space-y-6">
                {invoiceData.policy.map((policyItem, policyIndex) => (
                  <div key={policyItem.policy.id} className="space-y-4">
                    {/* Policy Header */}
                    <div className="p-6 rounded-2xl backdrop-blur-sm bg-gradient-to-br from-blue-50/60 to-indigo-50/40 border border-white/20">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                          {policyIndex + 1}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-bold text-gray-800 mb-2">
                            {policyItem.policy.name}
                          </h4>
                          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                            {policyItem.policy.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Policy Details */}
                    <div className="space-y-3 ml-4">
                      {policyItem.policyDetails.map((detail, detailIndex) => (
                        <div
                          key={detail.id}
                          className="p-4 rounded-xl backdrop-blur-sm bg-white/40 border border-white/20"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center text-white text-xs font-bold">
                              {detailIndex + 1}
                            </div>
                            <div className="flex-1">
                              <h5 className="text-sm font-bold text-gray-800 mb-1">
                                {detail.title}
                              </h5>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {detail.content}
                              </p>

                              {detail.listItems &&
                                detail.listItems.length > 0 && (
                                  <div className="mt-3 space-y-1">
                                    <p className="text-xs font-semibold text-gray-700">
                                      Key Points:
                                    </p>
                                    <ul className="space-y-1">
                                      {detail.listItems.map(
                                        (item, itemIndex) => (
                                          <li
                                            key={itemIndex}
                                            className="flex items-start gap-2 text-xs text-gray-600"
                                          >
                                            <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                                            <span>{item}</span>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="bg-gradient-to-r from-transparent via-gray-300/50 to-transparent" />

            {/* Document Footer */}
            <div className="text-center space-y-4">
              <div className="p-6 rounded-2xl backdrop-blur-sm bg-gradient-to-br from-gray-50/60 to-white/40 border border-white/20">
                <p className="text-sm text-gray-600 mb-2">
                  This document was generated on {currentDate} and serves as an
                  official record of the cargo service agreement for booking #
                  {invoiceData.cargo.bookingId.slice(-8)} with a total amount of
                  GH₵
                  {total.toFixed(2)}.
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Digitally verified and authenticated</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FullInvoiceDocument;

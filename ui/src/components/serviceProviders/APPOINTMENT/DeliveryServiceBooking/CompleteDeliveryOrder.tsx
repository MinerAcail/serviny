"use client";

import React from "react";
import {
  CalendarIcon,
  MapPin,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DeliverySegment } from "./DeliveryServiceSystem";

interface UserData {
  notes: string;
  itemType?: string;
}

interface DeliveryItem {
  id: string;
  itemDescription: string;
  deliveryAddress: string;
  dropoffLocation: [number, number];
  notes: string;
}

interface CompleteDeliveryOrderProps {
  isDialogOpen: boolean;
  setIsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  deliverySegments: DeliverySegment[];
  userData: UserData;
  orderSize: number;
  confirmDelivery: () => void;
  orderLoading: boolean;
  handleUserChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  setOrderSize: React.Dispatch<React.SetStateAction<number>>;
  isMultiLocation: boolean;
  setIsMultiLocation: React.Dispatch<React.SetStateAction<boolean>>;
  deliveryItems: DeliveryItem[];
  handleDeliveryItemChange: (itemId: string, field: string, value: any) => void;
  deliveryWaitTime: number;
  increaseWaitTime: () => void;
  decreaseWaitTime: () => void;
  maxDeliveryWaitTime: number;
}

export const CompleteDeliveryOrder: React.FC<CompleteDeliveryOrderProps> = ({
  isDialogOpen,
  setIsDialogOpen,
  deliverySegments,
  userData,
  orderSize,
  confirmDelivery,
  orderLoading,
  handleUserChange,
  setOrderSize,
  isMultiLocation,
  setIsMultiLocation,
  deliveryItems,
  handleDeliveryItemChange,
}) => {
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-sm border border-gray-100 shadow-xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Complete Your Order
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4 px-6">
          {/* Delivery Time Summary */}
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-3 flex items-center text-gray-900">
              <CalendarIcon className="h-4 w-4 mr-2 text-blue-500" />
              Delivery Schedule
            </h3>

            <div className="space-y-2">
              {deliverySegments.map((segment, index) => (
                <div
                  key={index}
                  className="p-3 bg-blue-50 rounded-xl border border-blue-100"
                >
                  <div className="flex items-center gap-2 text-gray-900">
                    <span className="font-medium">{segment.formattedDate}</span>
                    <span className="text-gray-500">•</span>
                    <span>
                      {segment.startTime} - {segment.endTime}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Size */}
          <div>
            <Label
              htmlFor="orderSize"
              className="block mb-2 text-sm font-medium text-gray-900"
            >
              Number of Items
            </Label>
            <Select
              value={orderSize.toString()}
              onValueChange={(value) => setOrderSize(parseInt(value))}
            >
              <SelectTrigger className="w-full rounded-xl border-gray-200 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-200">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size} {size === 1 ? "item" : "items"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Multi-location toggle (only show if more than 1 item) */}
          {orderSize > 1 && (
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-amber-600" />
                <div>
                  <Label className="text-sm font-medium text-amber-900">
                    Are these going to different locations?
                  </Label>
                  <p className="text-xs text-amber-700">
                    Enable if items need to be delivered to separate addresses
                  </p>
                </div>
              </div>
              <Switch
                checked={isMultiLocation}
                onCheckedChange={setIsMultiLocation}
              />
            </div>
          )}

          {/* Delivery Items */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">
              {isMultiLocation ? "Delivery Details (Per Item)" : "Delivery Details"}
            </h3>
            
            {isMultiLocation ? (
              // Multi-location: Show form for each item
              <div className="space-y-4">
                {deliveryItems.map((item, index) => (
                  <Card key={item.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900">
                          Item {index + 1}
                        </h4>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs font-medium text-gray-700">
                            Item Description
                          </Label>
                          <Input
                            placeholder="Describe this item..."
                            value={item.itemDescription}
                            onChange={(e) => handleDeliveryItemChange(item.id, 'itemDescription', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-xs font-medium text-gray-700">
                            Special Instructions
                          </Label>
                          <Textarea
                            placeholder="Any special delivery instructions for this item..."
                            value={item.notes}
                            onChange={(e) => handleDeliveryItemChange(item.id, 'notes', e.target.value)}
                            className="mt-1 min-h-[60px] resize-none"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              // Single location: Show unified form
              <div className="space-y-4">
                <div>
                  <Label htmlFor="itemType" className="block mb-2 text-sm font-medium text-gray-900">
                    Item Description
                  </Label>
                  <Textarea
                    id="itemType"
                    name="itemType"
                    placeholder="Please describe your items..."
                    value={userData.itemType}
                    onChange={handleUserChange}
                    className="w-full rounded-xl border-gray-200 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 min-h-[50px] resize-none"
                  />
                </div>
                
                <div>
                  <Label htmlFor="notes" className="block mb-2 text-sm font-medium text-gray-900">
                    Special Instructions
                  </Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={userData.notes}
                    onChange={handleUserChange}
                    placeholder="Any special delivery instructions..."
                    className="w-full rounded-xl border-gray-200 bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 min-h-[100px] resize-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3 mt-2">
          <Button
            className="w-full sm:w-auto rounded-full bg-blue-500 hover:bg-blue-600 text-white"
            onClick={confirmDelivery}
            disabled={orderLoading}
          >
            {orderLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>Processing...</span>
              </div>
            ) : (
              "Confirm Delivery"
            )}
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto rounded-full border-gray-300 text-gray-700 hover:bg-gray-100"
            onClick={() => setIsDialogOpen(false)}
          >
            Back
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
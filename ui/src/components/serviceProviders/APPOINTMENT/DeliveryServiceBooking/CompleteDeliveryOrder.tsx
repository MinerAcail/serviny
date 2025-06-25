"use client";

import React, { useState } from "react";
import {
  CalendarIcon,
  MapPin,
  Truck,
  Package,
  Check,
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
  customCargoType?: string; // New field for individual cargo vehicle selection
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
  // New cargo-related props
  isCargo: boolean;
  setIsCargo: React.Dispatch<React.SetStateAction<boolean>>;
  cargoType: string;
  setCargoType: React.Dispatch<React.SetStateAction<string>>;
  splitCargo: boolean;
  setSplitCargo: React.Dispatch<React.SetStateAction<boolean>>;
}

const CARGO_TYPES = [
  { value: "mini-truck", label: "Mini Truck" },
  { value: "van", label: "Van" },
  { value: "pickup", label: "Pickup Truck" },
  { value: "container-truck", label: "Container Truck" },
  { value: "flatbed", label: "Flatbed Truck" },
  { value: "refrigerated", label: "Refrigerated Truck" },
];

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
  isCargo,
  setIsCargo,
  cargoType,
  setCargoType,
  splitCargo,
  setSplitCargo,
}) => {
  const [showCargoTypeDialog, setShowCargoTypeDialog] = useState(false);
  const [showSplitCargoDialog, setShowSplitCargoDialog] = useState(false);
  const [showIndividualCargoDialog, setShowIndividualCargoDialog] = useState(false);
  const [currentEditingItem, setCurrentEditingItem] = useState<string | null>(null);
  const [splitCargoDecisionMade, setSplitCargoDecisionMade] = useState(false);

  const handleCargoToggle = (checked: boolean) => {
    setIsCargo(checked);
    if (checked) {
      setShowCargoTypeDialog(true);
    } else {
      setCargoType("");
      setSplitCargo(false);
      setSplitCargoDecisionMade(false);
      // Clear individual cargo types
      deliveryItems.forEach(item => {
        handleDeliveryItemChange(item.id, 'customCargoType', undefined);
      });
    }
  };

  const handleCargoTypeConfirm = () => {
    setShowCargoTypeDialog(false);
    // If multiple locations and cargo is enabled, ask about split cargo
    if (isMultiLocation && orderSize > 1 && !splitCargoDecisionMade) {
      setShowSplitCargoDialog(true);
    }
  };

  const handleSplitCargoConfirm = () => {
    setShowSplitCargoDialog(false);
    setSplitCargoDecisionMade(true);
  };

  const handleIndividualCargoChange = (itemId: string) => {
    setCurrentEditingItem(itemId);
    setShowIndividualCargoDialog(true);
  };

  const handleIndividualCargoConfirm = (selectedCargoType: string) => {
    if (currentEditingItem) {
      handleDeliveryItemChange(currentEditingItem, 'customCargoType', selectedCargoType);
    }
    setShowIndividualCargoDialog(false);
    setCurrentEditingItem(null);
  };

  const getItemCargoType = (item?: DeliveryItem): string => {
    if (!item) return cargoType;
    return item.customCargoType || cargoType;
  };

  const getCargoTypeLabel = (type: string): string => {
    return CARGO_TYPES.find(cargoTypeOption => cargoTypeOption.value === type)?.label || type;
  };

  const handleConfirmDelivery = () => {
    // If cargo is enabled but no type selected, show dialog
    if (isCargo && !cargoType) {
      setShowCargoTypeDialog(true);
      return;
    }
    
    // If multi-location cargo and split decision hasn't been made yet, show dialog
    if (isCargo && isMultiLocation && orderSize > 1 && !splitCargoDecisionMade) {
      setShowSplitCargoDialog(true);
      return;
    }
    
    confirmDelivery();
  };

  return (
    <>
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

            {/* Cargo Delivery Toggle */}
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl border border-orange-200">
              <div className="flex items-center space-x-3">
                <Truck className="h-5 w-5 text-orange-600" />
                <div>
                  <Label className="text-sm font-medium text-orange-900">
                    Is this a cargo delivery?
                  </Label>
                  <p className="text-xs text-orange-700">
                    Enable for large items that require special vehicles
                  </p>
                </div>
              </div>
              <Switch
                checked={isCargo}
                onCheckedChange={handleCargoToggle}
              />
            </div>

            {/* Cargo Type Display (if selected) */}
            {isCargo && cargoType && (
              <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">
                    Selected Vehicle: {CARGO_TYPES.find(type => type.value === cargoType)?.label}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCargoTypeDialog(true)}
                    className="ml-auto text-green-700 hover:text-green-900"
                  >
                    Change
                  </Button>
                </div>
              </div>
            )}

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
                  onCheckedChange={(checked) => {
                    setIsMultiLocation(checked);
                    // If enabling multi-location with cargo, ask about split cargo
                    if (checked && isCargo && cargoType) {
                      setShowSplitCargoDialog(true);
                    }
                  }}
                />
              </div>
            )}

            {/* Split Cargo Display (if applicable) */}
            {isCargo && isMultiLocation && orderSize > 1 && (
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">
                      Cargo Strategy: {splitCargo ? "Separate vehicles for each location" : "Single vehicle for all deliveries"}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSplitCargoDialog(true)}
                    className="text-purple-700 hover:text-purple-900"
                  >
                    Change
                  </Button>
                </div>
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
                          {isCargo && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                                {getCargoTypeLabel(getItemCargoType(item))}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleIndividualCargoChange(item.id)}
                                className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 h-auto"
                              >
                                Change Vehicle
                              </Button>
                            </div>
                          )}
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
                // Single location: Show unified form with global cargo option override
                <div className="space-y-4">
                  {/* Global Cargo Change Option for Single Location */}
                  {isCargo && (
                    <div className="p-3 bg-orange-50 rounded-xl border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium text-orange-900">
                            Selected Vehicle: {getCargoTypeLabel(cargoType)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCargoTypeDialog(true)}
                          className="text-orange-700 hover:text-orange-900 text-xs px-2 py-1 h-auto"
                        >
                          Change Vehicle
                        </Button>
                      </div>
                    </div>
                  )}

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
              onClick={handleConfirmDelivery}
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

      {/* Cargo Type Selection Dialog */}
      <Dialog open={showCargoTypeDialog} onOpenChange={setShowCargoTypeDialog}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm border border-gray-100 shadow-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Select Cargo Vehicle Type
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Choose the type of vehicle that best suits your cargo delivery needs:
            </p>
            
            <div className="space-y-3">
              {CARGO_TYPES.map((type) => (
                <div
                  key={type.value}
                  onClick={() => setCargoType(type.value)}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    cargoType === type.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Truck className={`h-5 w-5 ${
                      cargoType === type.value ? "text-blue-600" : "text-gray-500"
                    }`} />
                    <span className={`font-medium ${
                      cargoType === type.value ? "text-blue-900" : "text-gray-900"
                    }`}>
                      {type.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCargo(false);
                setCargoType("");
                setShowCargoTypeDialog(false);
              }}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCargoTypeConfirm}
              disabled={!cargoType}
              className="rounded-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              Confirm Vehicle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Split Cargo Dialog */}
      <Dialog open={showSplitCargoDialog} onOpenChange={setShowSplitCargoDialog}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm border border-gray-100 shadow-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Cargo Vehicle Strategy
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              You have multiple delivery locations. How would you like to handle the cargo vehicles?
            </p>
            
            <div className="space-y-3">
              <div
                onClick={() => setSplitCargo(false)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  !splitCargo
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Truck className={`h-5 w-5 mt-0.5 ${
                    !splitCargo ? "text-blue-600" : "text-gray-500"
                  }`} />
                  <div>
                    <div className={`font-medium ${
                      !splitCargo ? "text-blue-900" : "text-gray-900"
                    }`}>
                      Single Cargo Vehicle
                    </div>
                    <div className="text-sm text-gray-600">
                      One {CARGO_TYPES.find(type => type.value === cargoType)?.label} will deliver to all locations
                    </div>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setSplitCargo(true)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  splitCargo
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex gap-1">
                    <Truck className={`h-4 w-4 mt-0.5 ${
                      splitCargo ? "text-blue-600" : "text-gray-500"
                    }`} />
                    <Truck className={`h-4 w-4 mt-0.5 ${
                      splitCargo ? "text-blue-600" : "text-gray-500"
                    }`} />
                  </div>
                  <div>
                    <div className={`font-medium ${
                      splitCargo ? "text-blue-900" : "text-gray-900"
                    }`}>
                      Separate Cargo Vehicles
                    </div>
                    <div className="text-sm text-gray-600">
                      Each destination gets its own dedicated {CARGO_TYPES.find(type => type.value === cargoType)?.label}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSplitCargoDialog(false)}
              className="rounded-full"
            >
              Back
            </Button>
            <Button
              onClick={handleSplitCargoConfirm}
              className="rounded-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              Confirm Strategy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> 
      {/* Individual Cargo Selection Dialog */}
      <Dialog open={showIndividualCargoDialog} onOpenChange={setShowIndividualCargoDialog}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm border border-gray-100 shadow-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Change Vehicle for This Item
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Select a different cargo vehicle for this specific delivery:
            </p>
            
            <div className="space-y-3">
              {CARGO_TYPES.map((type) => {
                const currentItem = deliveryItems.find(item => item.id === currentEditingItem);
                const isSelected = getItemCargoType(currentItem!) === type.value;
                
                return (
                  <div
                    key={type.value}
                    onClick={() => handleIndividualCargoConfirm(type.value)}
                    className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Truck className={`h-5 w-5 ${
                        isSelected ? "text-blue-600" : "text-gray-500"
                      }`} />
                      <div className="flex-1">
                        <span className={`font-medium ${
                          isSelected ? "text-blue-900" : "text-gray-900"
                        }`}>
                          {type.label}
                        </span>
                        {isSelected && getItemCargoType(currentItem!) !== cargoType && (
                          <div className="text-xs text-blue-600 mt-1">
                            Different from default ({getCargoTypeLabel(cargoType)})
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Reset to Default Option */}
            <div className="pt-2 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => handleIndividualCargoConfirm(cargoType)}
                className="w-full rounded-xl text-gray-700 border-gray-300"
              >
                <Package className="h-4 w-4 mr-2" />
                Use Default Vehicle ({getCargoTypeLabel(cargoType)})
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowIndividualCargoDialog(false);
                setCurrentEditingItem(null);
              }}
              className="rounded-full"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
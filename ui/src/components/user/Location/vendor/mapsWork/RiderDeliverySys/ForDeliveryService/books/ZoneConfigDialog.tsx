// ZoneConfigDialog.tsx - Zone Configuration Dialog Component

import React from "react";
import {
  Clock,
  Ruler,
  Plus,
  Trash2,
  Save,
  Eye,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import { Zone, Location } from "./types";

interface ZoneConfigDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  zones: Zone[];
  setZones: (zones: Zone[]) => void;
  zoneMethod: "distance" | "time";
  setZoneMethod: (method: "distance" | "time") => void;
  transportMode: "walking" | "cycling" | "driving";
  setTransportMode: (mode: "walking" | "cycling" | "driving") => void;
  hasUnsavedChanges: boolean;
  validationErrors: string[];
  showPreview: boolean;
  setShowPreview: (show: boolean) => void;
  centerLocation: Location | null;
  isSaving: boolean;
  isProcessing: boolean;
  saveStatus: {
    type: "success" | "error";
    message: string;
    data?: any;
  } | null;
  onSave: () => void;
  onReset: () => void;
  onAddZone: (zoneData: { min: number; max: number; price: number }) => void;
  onUpdateZone: (zoneId: string, field: keyof Zone, value: string | number) => void;
  onRemoveZone: (zoneId: string) => void;
}

export function ZoneConfigDialog({
  isOpen,
  onOpenChange,
  zones,
  zoneMethod,
  setZoneMethod,
  transportMode,
  setTransportMode,
  hasUnsavedChanges,
  validationErrors,
  showPreview,
  setShowPreview,
  centerLocation,
  isSaving,
  isProcessing,
  saveStatus,
  onSave,
  onReset,
  onAddZone,
  onUpdateZone,
  onRemoveZone,
}: ZoneConfigDialogProps) {
  const [showAddZoneDialog, setShowAddZoneDialog] = React.useState(false);
  const [newZoneData, setNewZoneData] = React.useState({
    min: 0,
    max: 3,
    price: 5.0,
  });

  const handleAddZone = () => {
    onAddZone(newZoneData);
    setShowAddZoneDialog(false);
    setNewZoneData({
      min: 0,
      max: 3,
      price: 5.0,
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center justify-between">
              <span>Zone Configuration</span>
              <div className="flex items-center space-x-2">
                {hasUnsavedChanges && (
                  <span className="text-sm bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                    Unsaved Changes
                  </span>
                )}
                <Button
                  onClick={onReset}
                  variant="outline"
                  size="sm"
                  disabled={!hasUnsavedChanges || isProcessing}
                  className="rounded-xl"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
              </div>
            </DialogTitle>
            <DialogDescription>
              Configure your service zones and pricing structure
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Zone Method & Transport Mode */}
            <div className="space-y-6">
              <div>
                <Label className="block text-sm font-semibold text-gray-900 mb-4">
                  Zone Definition Method
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    onClick={() => setZoneMethod("distance")}
                    variant={zoneMethod === "distance" ? "default" : "outline"}
                    className={`p-6 flex flex-col items-center space-y-3 h-auto rounded-2xl ${
                      zoneMethod === "distance" ? "bg-blue-600 text-white" : ""
                    }`}
                    disabled={isProcessing}
                  >
                    <Ruler className="w-8 h-8" />
                    <span className="font-semibold text-lg">Distance</span>
                    <span className="text-sm opacity-80">Kilometers</span>
                  </Button>
                  <Button
                    onClick={() => setZoneMethod("time")}
                    variant={zoneMethod === "time" ? "default" : "outline"}
                    className={`p-6 flex flex-col items-center space-y-3 h-auto rounded-2xl ${
                      zoneMethod === "time" ? "bg-blue-600 text-white" : ""
                    }`}
                    disabled={isProcessing}
                  >
                    <Clock className="w-8 h-8" />
                    <span className="font-semibold text-lg">Time</span>
                    <span className="text-sm opacity-80">Minutes</span>
                  </Button>
                </div>
              </div>

              {zoneMethod === "time" && (
                <div>
                  <Label className="block text-sm font-semibold text-gray-900 mb-3">
                    Transport Mode
                  </Label>
                  <Select
                    value={transportMode}
                    onValueChange={(value) =>
                      setTransportMode(value as "walking" | "cycling" | "driving")
                    }
                    disabled={isProcessing}
                  >
                    <SelectTrigger className="w-full p-4 border-2 border-gray-200 rounded-2xl">
                      <SelectValue placeholder="Select transport mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="walking">Walking (~5 km/h)</SelectItem>
                      <SelectItem value="cycling">Cycling (~15 km/h)</SelectItem>
                      <SelectItem value="driving">Driving (~40 km/h)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Zone Configuration */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg font-semibold text-gray-900">
                  Pricing Zones ({zones.length})
                  {zones.filter((z) => z.isLocal).length > 0 && (
                    <span className="ml-2 text-sm text-amber-600">
                      ({zones.filter((z) => z.isLocal).length} unsaved)
                    </span>
                  )}
                </Label>
                <Button
                  onClick={() => setShowAddZoneDialog(true)}
                  className="flex items-center space-x-2 rounded-2xl"
                  disabled={isProcessing}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Zone</span>
                </Button>
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
                  <div className="flex items-center text-red-700 mb-2">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    <span className="font-medium">Validation Errors:</span>
                  </div>
                  <ul className="text-sm text-red-600 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="list-disc list-inside">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {zones.map((zone, index) => (
                  <Card
                    key={zone.id}
                    className={`overflow-hidden rounded-3xl border-2 ${
                      zone.isLocal
                        ? "border-amber-300 bg-amber-50/50"
                        : "border-gray-200"
                    }`}
                  >
                    <CardHeader className="p-4 bg-gray-50 border-b">
                      <CardTitle className="text-base flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-6 h-6 rounded-full ring-2 ring-white shadow-md"
                            style={{ backgroundColor: zone.color }}
                          />
                          <span className="font-semibold text-gray-900">
                            Zone {index + 1}
                          </span>
                          {zone.isLocal ? (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                              Unsaved
                            </span>
                          ) : (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                              Saved
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {zones.length > 1 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 rounded-xl"
                                  onClick={() => onRemoveZone(zone.id)}
                                  disabled={isProcessing}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Remove zone</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      {/* Zone Controls */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">
                            Min {zoneMethod === "distance" ? "km" : "min"}
                          </Label>
                          <Input
                            type="number"
                            value={zone.min}
                            onChange={(e) =>
                              onUpdateZone(zone.id, "min", e.target.value)
                            }
                            className="mt-1"
                            step={zoneMethod === "distance" ? 0.5 : 1}
                            disabled={isProcessing}
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium">
                            Max {zoneMethod === "distance" ? "km" : "min"}
                          </Label>
                          <Input
                            type="number"
                            value={zone.max}
                            onChange={(e) =>
                              onUpdateZone(zone.id, "max", e.target.value)
                            }
                            className="mt-1"
                            step={zoneMethod === "distance" ? 0.5 : 1}
                            disabled={isProcessing}
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Price (GH₵)</Label>
                        <Input
                          type="number"
                          value={zone.price}
                          onChange={(e) =>
                            onUpdateZone(zone.id, "price", e.target.value)
                          }
                          className="mt-1"
                          step={0.5}
                          min={0.5}
                          disabled={isProcessing}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Preview Toggle */}
            <div className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl">
              <div className="flex items-center space-x-4">
                <Switch
                  id="preview"
                  checked={showPreview}
                  onCheckedChange={setShowPreview}
                />
                <Label
                  htmlFor="preview"
                  className="text-sm font-medium text-gray-900 cursor-pointer"
                >
                  Show zone preview on map
                </Label>
              </div>
              <Eye className="w-5 h-5 text-gray-400" />
            </div>

            {/* Save Button */}
            <Button
              onClick={onSave}
              disabled={
                !centerLocation ||
                isSaving ||
                validationErrors.length > 0 ||
                isProcessing
              }
              className="w-full py-6 rounded-3xl font-semibold flex items-center justify-center space-x-3 transition-all duration-200"
              size="lg"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving Configuration...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Zone Configuration</span>
                </>
              )}
            </Button>

            {/* Save Status */}
            {saveStatus && (
              <div
                className={`p-4 rounded-3xl border-2 text-sm font-medium ${
                  saveStatus.type === "success"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                <div className="flex items-center">
                  {saveStatus.type === "success" ? (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mr-2" />
                  )}
                  {saveStatus.message}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Zone Dialog */}
      <Dialog open={showAddZoneDialog} onOpenChange={setShowAddZoneDialog}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add New Zone</DialogTitle>
            <DialogDescription>
              Configure your new service zone
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-8 py-6">
            {/* Range Slider */}
            <div className="space-y-6">
              <div className="text-center">
                <Label className="text-lg font-semibold text-gray-900">
                  Range: {newZoneData.min} - {newZoneData.max}{" "}
                  {zoneMethod === "distance" ? "km" : "min"}
                </Label>
              </div>
              <div className="px-4">
                <Slider
                  value={[newZoneData.min, newZoneData.max]}
                  onValueChange={(range) =>
                    setNewZoneData({
                      ...newZoneData,
                      min: range[0],
                      max: range[1],
                    })
                  }
                  max={zoneMethod === "distance" ? 50 : 120}
                  min={0}
                  step={zoneMethod === "distance" ? 0.5 : 1}
                  className="w-full h-3"
                />
              </div>
            </div>

            {/* Price Slider */}
            <div className="space-y-6">
              <div className="text-center">
                <Label className="text-lg font-semibold text-gray-900">
                  Price: GH₵{newZoneData.price.toFixed(2)}
                </Label>
              </div>
              <div className="px-4">
                <Slider
                  value={[newZoneData.price]}
                  onValueChange={(value) =>
                    setNewZoneData({
                      ...newZoneData,
                      price: value[0],
                    })
                  }
                  max={200}
                  min={0.5}
                  step={0.5}
                  className="w-full h-3"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowAddZoneDialog(false)}
              className="rounded-2xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddZone}
              disabled={
                newZoneData.max <= newZoneData.min ||
                newZoneData.price <= 0 ||
                isProcessing
              }
              className="rounded-2xl"
            >
              Add Zone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
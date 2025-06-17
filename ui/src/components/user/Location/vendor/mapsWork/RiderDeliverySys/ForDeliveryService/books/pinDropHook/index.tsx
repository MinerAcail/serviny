// Enhanced Pin Drop Hook with Click-to-Drop and Draggable Pins
import { useState, useCallback, useRef, useEffect } from "react"
import { toast } from "sonner"
import maplibregl from "maplibre-gl"
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Package, X } from "lucide-react";

// import type { Location } from "./riderBookingHooks"
export interface Location {
  lng: number
  lat: number
  address: string
}

//done
export function useEnhancedPinDrop(
  mapInstance: React.RefObject<maplibregl.Map | null>,
  geocoderRef?: React.RefObject<google.maps.Geocoder | null>
) {
  const [pinDropState, setPinDropState] = useState<{
    isActive: boolean
    mode: 'pickup' | 'dropoff' | null
    selectedDeliveryItemId: string | null
    showDialog: boolean
    pendingLocation: { lng: number; lat: number } | null
  }>({
    isActive: false,
    mode: null,
    selectedDeliveryItemId: null,
    showDialog: false,
    pendingLocation: null
  })

  const [draggablePin, setDraggablePin] = useState<maplibregl.Marker | null>(null)
  const [currentAddress, setCurrentAddress] = useState<string>("")
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)
  const mapClickHandlerRef = useRef<((e: maplibregl.MapMouseEvent) => void) | null>(null)

  // Reverse geocoding function
  const reverseGeocode = useCallback(async (lat: number, lng: number): Promise<string> => {
    try {
      if (geocoderRef?.current) {
        return new Promise((resolve) => {
          geocoderRef.current!.geocode(
            { location: { lat, lng } },
            (results, status) => {
              if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
                resolve(results[0].formatted_address)
              } else {
                resolve(`📍 Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`)
              }
            }
          )
        })
      }
      return `📍 Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`
    } catch (error) {
      console.error("Reverse geocoding error:", error)
      return `📍 Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`
    }
  }, [geocoderRef])

  // Create draggable pin with enhanced styling
  const createDraggablePin = useCallback((lng: number, lat: number, mode: 'pickup' | 'dropoff', deliveryIndex?: number) => {
    if (!mapInstance.current) return null

    const color = mode === 'pickup' ? '#22c55e' : '#ef4444'
    const icon = mode === 'pickup' ? '📍' : (deliveryIndex ? deliveryIndex.toString() : '🎯')
    
    // Create custom pin element
    const pinElement = document.createElement('div')
    pinElement.className = 'custom-pin'
    pinElement.innerHTML = `
      <div style="
        width: 32px;
        height: 32px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 6px 12px rgba(0,0,0,0.4);
        cursor: grab;
        transition: transform 0.2s ease;
      ">
        <div style="
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(45deg);
          font-size: ${mode === 'pickup' ? '16px' : '14px'};
          font-weight: bold;
          color: white;
        ">
          ${icon}
        </div>
      </div>
    `

    const marker = new maplibregl.Marker({
      element: pinElement,
      draggable: true
    })
      .setLngLat([lng, lat])
      .addTo(mapInstance.current)

    // Handle drag events
    marker.on('dragstart', () => {
      pinElement.style.transform = 'rotate(-45deg) scale(1.2)'
      pinElement.style.cursor = 'grabbing'
      setIsLoadingAddress(true)
    })

    marker.on('drag', () => {
      setIsLoadingAddress(true)
    })

    marker.on('dragend', async () => {
      pinElement.style.transform = 'rotate(-45deg) scale(1)'
      pinElement.style.cursor = 'grab'
      
      const lngLat = marker.getLngLat()
      try {
        const address = await reverseGeocode(lngLat.lat, lngLat.lng)
        setCurrentAddress(address)
      } catch (error) {
        setCurrentAddress("Unable to get address")
      } finally {
        setIsLoadingAddress(false)
      }
    })

    return marker
  }, [mapInstance, reverseGeocode])

  // Add map click handler for pin dropping
  const addMapClickHandler = useCallback(() => {
    if (!mapInstance.current || mapClickHandlerRef.current) return

    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      const { lng, lat } = e.lngLat
      setPinDropState(prev => ({
        ...prev,
        showDialog: true,
        pendingLocation: { lng, lat }
      }))
    }

    mapClickHandlerRef.current = handleMapClick
    mapInstance.current.on('click', handleMapClick)
  }, [mapInstance])

  // Remove map click handler
  const removeMapClickHandler = useCallback(() => {
    if (!mapInstance.current || !mapClickHandlerRef.current) return

    mapInstance.current.off('click', mapClickHandlerRef.current)
    mapClickHandlerRef.current = null
  }, [mapInstance])

  // Start pin drop mode
  const startPinDropMode = useCallback(() => {
    setPinDropState(prev => ({ 
      ...prev, 
      isActive: true,
      mode: null,
      selectedDeliveryItemId: null
    }))
    addMapClickHandler()
    
    toast.info("Pin Drop Mode Active", {
      description: "Click anywhere on the map to drop a pin"
    })
  }, [addMapClickHandler])

  // Handle dialog choice (pickup or dropoff with optional delivery item ID)
  const handleDialogChoice = useCallback(async (mode: 'pickup' | 'dropoff', deliveryItemId?: string) => {
    const { pendingLocation } = pinDropState
    if (!pendingLocation) return

    console.log(`🎯 Pin drop choice: ${mode}${deliveryItemId ? ` for delivery ${deliveryItemId}` : ''}`)

    setPinDropState(prev => ({
      ...prev,
      mode,
      selectedDeliveryItemId: deliveryItemId || null,
      showDialog: false,
      pendingLocation: null
    }))

    setIsLoadingAddress(true)

    // Remove existing draggable pin
    if (draggablePin) {
      draggablePin.remove()
    }

    // Get delivery index for display (if applicable)
    let deliveryIndex: number | undefined
    if (mode === 'dropoff' && deliveryItemId) {
      // This will be passed from the parent component
      deliveryIndex = undefined // Will be set by parent
    }

    // Create new draggable pin
    const newPin = createDraggablePin(pendingLocation.lng, pendingLocation.lat, mode, deliveryIndex)
    setDraggablePin(newPin)

    // Get initial address
    try {
      const address = await reverseGeocode(pendingLocation.lat, pendingLocation.lng)
      setCurrentAddress(address)
    } catch (error) {
      setCurrentAddress("Unable to get address")
    } finally {
      setIsLoadingAddress(false)
    }

    const modeText = mode === 'pickup' ? 'Pickup' : 'Delivery'
    toast.success(`${modeText} pin placed!`, {
      description: "Drag the pin to adjust the location"
    })
  }, [pinDropState, draggablePin, createDraggablePin, reverseGeocode])

  // Cancel pin drop
  const cancelPinDrop = useCallback(() => {
    if (draggablePin) {
      draggablePin.remove()
      setDraggablePin(null)
    }
    
    removeMapClickHandler()
    setPinDropState({
      isActive: false,
      mode: null,
      selectedDeliveryItemId: null,
      showDialog: false,
      pendingLocation: null
    })
    setCurrentAddress("")
    
    toast.info("Pin drop cancelled")
  }, [draggablePin, removeMapClickHandler])

  // Cancel dialog without dropping pin
  const cancelDialog = useCallback(() => {
    setPinDropState(prev => ({
      ...prev,
      showDialog: false,
      pendingLocation: null
    }))
  }, [])

  // Confirm pin location
const confirmPinLocation = useCallback(() => {
  if (!draggablePin || !pinDropState.mode) return null

  const lngLat = draggablePin.getLngLat()
  const location: Location = {
    lng: lngLat.lng,
    lat: lngLat.lat,
    address: currentAddress
  }

  const mode = pinDropState.mode
  const deliveryItemId = pinDropState.selectedDeliveryItemId

  console.log(`✅ Confirming pin location:`, { location, mode, deliveryItemId })

  // Clean up
  draggablePin.remove()
  setDraggablePin(null)
  removeMapClickHandler()
  setPinDropState({
    isActive: false,
    mode: null,
    selectedDeliveryItemId: null,
    showDialog: false,
    pendingLocation: null
  })
  setCurrentAddress("")

  return { location, mode, deliveryItemId }
}, [draggablePin, pinDropState, currentAddress, removeMapClickHandler])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (draggablePin) draggablePin.remove()
      removeMapClickHandler()
    }
  }, [draggablePin, removeMapClickHandler])

  return {
    // State
    isActive: pinDropState.isActive,
    currentMode: pinDropState.mode,
    selectedDeliveryItemId: pinDropState.selectedDeliveryItemId,
    showDialog: pinDropState.showDialog,
    pendingLocation: pinDropState.pendingLocation,
    currentAddress,
    isLoadingAddress,
    
    // Actions
    startPinDropMode,
    handleDialogChoice,
    cancelPinDrop,
    cancelDialog,
    confirmPinLocation
  }
}



//done
// Pin Drop Dialog Component
interface EnhancedPinDropDialogProps {
  isOpen: boolean;
  onSelectMode: (mode: "pickup" | "dropoff", deliveryItemId?: string) => void;
  onCancel: () => void;
  hasPickup: boolean;
  hasDropoff: boolean;
  // NEW: Multi-delivery props
  deliveryItems?: MultiDeliveryItem[];
  isMultiDelivery?: boolean;
}

export function PinDropDialog({
  isOpen,
  onSelectMode,
  onCancel,
  hasPickup,
  hasDropoff,
  deliveryItems = [],
  isMultiDelivery = false,
}: EnhancedPinDropDialogProps) {
  const [showDeliverySelection, setShowDeliverySelection] = useState(false);

  if (!isOpen) return null;

  // Filter completed delivery items (items with addresses)
  const completedItems = deliveryItems.filter(item => 
    item.deliveryAddress && item.itemDescription
  );

  // Handle pickup selection
  const handlePickupSelect = () => {
    onSelectMode("pickup");
  };

  // Handle dropoff selection for single delivery
  const handleSingleDropoffSelect = () => {
    onSelectMode("dropoff");
  };

  // Handle dropoff selection for multi-delivery
  const handleMultiDropoffSelect = (deliveryItemId: string) => {
    onSelectMode("dropoff", deliveryItemId);
    setShowDeliverySelection(false);
  };

  // Show delivery selection screen
  const handleShowDeliverySelection = () => {
    setShowDeliverySelection(true);
  };

  // Go back to main selection
  const handleBackToMain = () => {
    setShowDeliverySelection(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={onCancel} 
      />
      
      {/* Dialog */}
      <motion.div 
        className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <AnimatePresence mode="wait">
          {!showDeliverySelection ? (
            // Main Selection Screen
            <motion.div
              key="main-selection"
              initial={{ opacity: 0, x: 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="p-6"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📍</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Drop Pin Here?
                </h3>
                <p className="text-sm text-gray-600">
                  What type of location would you like to set?
                </p>
              </div>
              
              <div className="space-y-3">
                {/* Pickup Location Button */}
                <button
                  onClick={handlePickupSelect}
                  className="w-full flex items-center justify-between p-4 border-2 border-green-200 rounded-xl hover:border-green-300 hover:bg-green-50 transition-all group"
                >
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-green-500 mr-3" />
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Pickup Location</div>
                      <div className="text-sm text-gray-500">Sets the zone center</div>
                    </div>
                  </div>
                  <div className="text-xl group-hover:scale-110 transition-transform">📍</div>
                </button>

                {/* Dropoff Location Button */}
                <button
                  onClick={isMultiDelivery && completedItems.length > 1 ? handleShowDeliverySelection : handleSingleDropoffSelect}
                  disabled={!hasPickup}
                  className={`w-full flex items-center justify-between p-4 border-2 rounded-xl transition-all group ${
                    hasPickup
                      ? 'border-red-200 hover:border-red-300 hover:bg-red-50'
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-red-500 mr-3" />
                    <div className="text-left">
                      <div className={`font-medium ${hasPickup ? 'text-gray-900' : 'text-gray-400'}`}>
                        Drop-off Location
                      </div>
                      <div className={`text-sm ${hasPickup ? 'text-gray-500' : 'text-gray-400'}`}>
                        {!hasPickup 
                          ? 'Set pickup first' 
                          : isMultiDelivery && completedItems.length > 1
                          ? `Choose from ${completedItems.length} destinations`
                          : 'Delivery destination'
                        }
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isMultiDelivery && completedItems.length > 1 && hasPickup && (
                      <div className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">
                        {completedItems.length}
                      </div>
                    )}
                    <div className={`text-xl transition-transform ${hasPickup && isMultiDelivery && completedItems.length > 1 ? 'group-hover:scale-110' : hasPickup ? 'group-hover:scale-110' : ''}`}>
                      {isMultiDelivery && completedItems.length > 1 && hasPickup ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        '🎯'
                      )}
                    </div>
                  </div>
                </button>
              </div>

              <button
                onClick={onCancel}
                className="w-full mt-4 px-4 py-3 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          ) : (
            // Delivery Selection Screen
            <motion.div
              key="delivery-selection"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="p-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={handleBackToMain}
                  className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <ChevronUp className="h-4 w-4 mr-1 rotate-90" />
                  <span className="text-sm">Back</span>
                </button>
                <button
                  onClick={onCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Select Delivery to Update
                </h3>
                <p className="text-sm text-gray-600">
                  Choose which delivery destination you want to move to the pinned location
                </p>
              </div>

              {/* Delivery Items List */}
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {completedItems.map((item, index) => (
                  <motion.button
                    key={item.id}
                    onClick={() => handleMultiDropoffSelect(item.id)}
                    className="w-full flex items-start space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all group text-left"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {/* Delivery Number */}
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm font-medium text-red-600 flex-shrink-0 group-hover:bg-red-200 transition-colors">
                      {index + 1}
                    </div>
                    
                    {/* Delivery Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 mb-1 truncate">
                        {item.itemDescription}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {item.deliveryAddress}
                      </p>
                      
                      {/* Current Status */}
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-xs text-green-600 font-medium">
                          Location set
                        </span>
                      </div>
                      
                      {/* Notes if any */}
                      {item.notes && (
                        <p className="text-xs text-gray-500 mt-1 italic">
                          Note: {item.notes}
                        </p>
                      )}
                    </div>

                    {/* Arrow Icon */}
                    <div className="flex-shrink-0 text-gray-400 group-hover:text-red-500 transition-colors">
                      <ChevronDown className="h-5 w-5 -rotate-90" />
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Info Note */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  💡 The selected delivery's location will be updated to the pinned position on the map.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}


//done
// Enhanced Pin Drop Control Panel
export function EnhancedPinDropControlPanel({
  isActive,
  mode,
  currentAddress,
  isLoadingAddress,
  onCancel,
  onConfirm
}: {
  isActive: boolean
  mode: 'pickup' | 'dropoff' | null
  currentAddress: string
  isLoadingAddress: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  if (!isActive || !mode) return null

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md mx-4">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden animate-in slide-in-from-top-4 duration-300">
        {/* Header */}
        <div className={`px-4 py-3 ${mode === 'pickup' ? 'bg-green-50 border-b border-green-200' : 'bg-red-50 border-b border-red-200'}`}>
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
              mode === 'pickup' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {mode === 'pickup' ? '📍' : '🎯'}
            </div>
            <div>
              <h3 className={`font-semibold ${mode === 'pickup' ? 'text-green-900' : 'text-red-900'}`}>
                {mode === 'pickup' ? 'Setting Pickup Location' : 'Setting Drop-off Location'}
              </h3>
              <p className={`text-sm ${mode === 'pickup' ? 'text-green-700' : 'text-red-700'}`}>
                Drag the pin to adjust position
              </p>
            </div>
          </div>
        </div>
        
        {/* Address Display */}
        <div className="p-4">
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
              Selected Location
            </p>
            <div className="flex items-start">
              {isLoadingAddress ? (
                <div className="flex items-center">
                  <svg className="animate-spin h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm text-gray-500">Updating address...</span>
                </div>
              ) : (
                <p className="text-sm text-gray-900 leading-relaxed">{currentAddress}</p>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoadingAddress}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isLoadingAddress
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : mode === 'pickup'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {isLoadingAddress ? 'Updating...' : 'Confirm Location'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
//done
// Enhanced Pin Drop Button
export function EnhancedPinDropButton({ 
  onStartPinDrop, 
  disabled = false,
  isActive = false
}: { 
  onStartPinDrop: () => void
  disabled?: boolean
  isActive?: boolean
}) {
  return (
    <button
      onClick={onStartPinDrop}
      disabled={disabled}
      className={`
        px-4 py-2 text-sm rounded-lg flex items-center font-medium transition-all duration-200 shadow-sm
        ${isActive 
          ? 'bg-blue-600 text-white border border-blue-600' 
          : 'bg-white text-gray-700 border border-gray-300 hover:bg-blue-50 hover:border-blue-300'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
      `}
    >
      <span className="mr-2">{isActive ? '🎯' : '📍'}</span>
      {isActive ? 'Pin Drop Active' : 'Drop Pin on Map'}
    </button>
  )
}
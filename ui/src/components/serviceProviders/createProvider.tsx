import { useMutation, gql } from "@apollo/client";
import { useForm } from "react-hook-form";
import React, { useEffect, useRef, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  X,
  Upload,
  CheckCircle,
  EyeOff,
  Eye,
  User,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  Store,
  Building2,
  Calendar,
  Package,
  Truck,
  Move,
  Check,
  Map,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

// Import country data
// import { countries } from "./data/countries";
import { useJsApiLoader, GoogleMap, type Libraries } from "@react-google-maps/api";
import { useNavigate } from "react-router";
import { formatPrice } from "../global/formatPrice";

// GraphQL Mutations
const CREATE_SERVICE = gql`
  mutation CreateService($dpfile: Upload, $input: CreateServiceInput!) {
    createService(dpfile: $dpfile, input: $input) {
      id
      name
      type
      number
      email
      location
      categories
      coordinates
      h3Indexes
      businessType
      dpfile
    }
  }
`;

const REQUEST_OTP = gql`
  mutation RequestOtp($input: RequestOtpInput!) {
    requestOtp(input: $input) {
      success
      message
      otpSent
      email
    }
  }
`;

const VERIFY_OTP = gql`
  mutation VerifyOtp($input: VerifyOtpInput!) {
    verifyOtp(input: $input) {
      success
      message
      IsValid
      otpSent
      email
    }
  }
`;

const RESEND_OTP = gql`
  mutation ResendOtp($input: RequestOtpInput!) {
    resendOTP(input: $input) {
      success
      message
      IsValid
      otpSent
      email
    }
  }
`;

// Interfaces
interface Categories {
  value: string;
  label: string;
}

interface BusinessType {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  price: number;
  category: "ecommerce" | "delivery" | "specialized";
}

interface CreateServiceInput {
  name: string;
  number: string;
  email: string;
  location?: string;
  categories?: string[];
  businessType?: string;
  password: string;
  coordinates?: number[];
  h3Indexes?: string[];
}

interface FormData {
  name: string;
  number: string;
  email: string;
  location?: string;
  password?: string;
  confirmPassword?: string;
}

interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

// Pin Dropper Component for Google Maps
const GoogleMapPinDropper: React.FC<{
  map: google.maps.Map | null;
  onLocationSelected: (coordinates: { lng: number; lat: number }) => void;
  onCancel: () => void;
}> = ({ map, onLocationSelected, onCancel }) => {
  const [centerCoordinates, setCenterCoordinates] = useState<{
    lng: number;
    lat: number;
  } | null>(null);
  const [addressInfo, setAddressInfo] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [countryName, setCountryName] = useState<string | null>(null);

  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const tooltipTimerRef = useRef<number | null>(null);

  // Initialize geocoder
  useEffect(() => {
    if (!geocoderRef.current && window.google && window.google.maps) {
      geocoderRef.current = new google.maps.Geocoder();
    }
  }, []);

  // Show entry toast
  useEffect(() => {
    toast.info("Pin Drop Mode", {
      description: "Drag the map to position the pin at your desired location",
      duration: 3000,
    });
  }, []);

  // Update center coordinates when map moves
  useEffect(() => {
    if (!map) return;

    // Get initial center coordinates
    const center = map.getCenter();
    if (center) {
      const coords = { lng: center.lng(), lat: center.lat() };
      setCenterCoordinates(coords);
      fetchAddressForLocation(coords.lat, coords.lng);
    }

    // Update coordinates when map movement ends
    const handleIdle = () => {
      const center = map.getCenter();
      if (center) {
        const coords = { lng: center.lng(), lat: center.lat() };
        setCenterCoordinates(coords);

        // Show tooltip briefly
        setShowTooltip(true);
        if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
        tooltipTimerRef.current = window.setTimeout(() => {
          setShowTooltip(false);
        }, 2000);

        // Try to get address for new position
        fetchAddressForLocation(coords.lat, coords.lng);
      }
    };

    map.addListener("idle", handleIdle);

    return () => {
      google.maps.event.clearListeners(map, "idle");
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    };
  }, [map]);

  // Fetch address for coordinates using Google Geocoder
  const fetchAddressForLocation = (lat: number, lng: number) => {
    if (!geocoderRef.current) return;

    geocoderRef.current.geocode(
      { location: { lat, lng } },
      (results, status) => {
        if (status === "OK" && results && results[0]) {
          const address = results[0].formatted_address;
          setAddressInfo(address);

          // Extract country from address_components
          const countryComponent = results[0].address_components.find(
            (component) => component.types.includes("country")
          );

          if (countryComponent) {
            setCountryName(countryComponent.long_name);
          }
        } else {
          setAddressInfo(null);
        }
      }
    );
  };

  // Handle confirm button click
  const handleConfirm = () => {
    if (centerCoordinates) {
      onLocationSelected(centerCoordinates);
    }
  };

  return (
    <>
      {/* Fixed pin in center of screen */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-full z-20 pointer-events-none">
        <div className="relative">
          {/* Pulsing effect */}
          <div className="absolute inset-0 w-8 h-8 bg-blue-500 rounded-full opacity-30 animate-ping"></div>
          <MapPin className="h-8 w-8 text-blue-600 stroke-2 relative z-10" />
        </div>
      </div>

      {/* Address tooltip near the pin */}
      <div
        className={`absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-[calc(100%+45px)] z-20 bg-white rounded-lg shadow-lg px-3 py-2 text-sm max-w-xs text-center transition-opacity duration-300 ${
          showTooltip ? "opacity-100" : "opacity-80"
        }`}
      >
        {addressInfo || "Move map to select location"}
      </div>

      {/* Instruction card */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-white/95 backdrop-blur-sm rounded-xl shadow-md p-3 max-w-xs text-center border">
        <div className="flex items-center justify-center mb-1">
          <Move className="h-4 w-4 mr-1.5 text-blue-600" />
          <h3 className="font-medium text-gray-900 text-sm">
            Pan the map to position the pin
          </h3>
        </div>
        <p className="text-xs text-gray-600 mb-3">
          Drag the map to place the pin at your desired location
        </p>

        {/* Coordinates display */}
        {centerCoordinates && (
          <div className="text-xs text-gray-600 bg-gray-100 rounded-lg p-2 mb-2 font-mono">
            {centerCoordinates.lat.toFixed(6)},{" "}
            {centerCoordinates.lng.toFixed(6)}
          </div>
        )}

        {/* Address display if available */}
        {addressInfo && (
          <div className="text-xs text-gray-900 font-medium mb-1 truncate max-w-[220px] mx-auto">
            {addressInfo}
          </div>
        )}
        {countryName && (
          <div className="text-xs text-gray-500 font-medium truncate max-w-[220px] mx-auto">
            Country: {countryName}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full bg-white text-red-600 border-red-300 hover:bg-red-50"
          onClick={onCancel}
        >
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
        <Button
          size="sm"
          className="rounded-full bg-blue-600 hover:bg-blue-700 text-white"
          onClick={handleConfirm}
        >
          <Check className="h-4 w-4 mr-1" />
          Confirm Location
        </Button>
      </div>
    </>
  );
};

// Business type selector component
const BusinessTypeSelector: React.FC<{
  onSelect: (value: string, label: string) => void;
}> = ({ onSelect }) => {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  const businessTypes: BusinessType[] = [
    {
      value: "ecommerce-standard",
      label: "Standard E-commerce",
      description: "Essential features for small businesses",
      icon: <Store className="h-5 w-5" />,
           price: 50,

      category: "ecommerce",
    },
    {
      value: "ecommerce-enterprise",
      label: "Enterprise E-commerce",
      description: "Advanced features for large businesses",
      icon: <Building2 className="h-5 w-5" />,
           price: 500,

      category: "ecommerce",
    },
    {
            value: "drop-shipping",
      label: "Drop-Shipping / Pre-Order",
      description: "Accept orders before product availability",
      icon: <Calendar className="h-5 w-5" />,
            price: 40,

      category: "ecommerce",
    },
   
    {
      value: "delivery-standard",
      label: "Standard Delivery",
      description: "For small to medium logistics needs",
      icon: <Truck className="h-5 w-5" />,
            price: 40,

      category: "delivery",
    },
    {
      value: "delivery-enterprise",
      label: "Enterprise Delivery",
      description: "For large-scale delivery operations",
      icon: <Truck className="h-5 w-5" />,
       price: 450,

      category: "delivery",
    },
  ];

  const handleSelect = (value: string, label: string) => {
    setSelectedType(value);
    setSelectedLabel(label);
  };

  const handleDone = () => {
    if (selectedType && selectedLabel) {
      onSelect(selectedType, selectedLabel);
      setOpen(false);
    }
  };

  // const formatPrice = (price: number) => {
  //   return new Intl.NumberFormat("en-US", {
  //     style: "currency",
  //     currency: "USD",
  //     minimumFractionDigits: 0,
  //   }).format(price);
  // };

  return (
    <div>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="flex items-center justify-between w-full h-12 px-4 rounded-full bg-white border border-gray-200 shadow-sm"
      >
        <span className="text-sm font-medium text-gray-700">
          {selectedLabel ? selectedLabel : "Select Business Type"}
        </span>
        <span className="text-gray-400">▼</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0 rounded-2xl overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-xl font-semibold text-center">
              Choose Business Type
            </DialogTitle>
            <DialogDescription className="text-center text-sm">
              Select the type of business model that fits your needs
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="ecommerce" className="w-full">
            <div className="px-6">
              <TabsList className="grid grid-cols-2 mb-4 rounded-full h-10 p-1 bg-gray-100">
                <TabsTrigger value="ecommerce" className="rounded-full text-xs">
                  E-commerce
                </TabsTrigger>
                <TabsTrigger value="delivery" className="rounded-full text-xs">
                  Delivery
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="h-[400px] px-6 pb-2">
              <TabsContent value="ecommerce" className="mt-0 space-y-2">
                {businessTypes
                  .filter((p) => p.category === "ecommerce")
                  .map((businessType) => (
                    <button
                      key={businessType.value}
                      onClick={() =>
                        handleSelect(businessType.value, businessType.label)
                      }
                      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                        selectedType === businessType.value
                          ? "bg-blue-50 border border-blue-200"
                          : "bg-white border border-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            selectedType === businessType.value
                              ? "bg-blue-100"
                              : "bg-gray-100"
                          }`}
                        >
                          {businessType.icon}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-sm">
                            {businessType.label}
                          </p>
                          <p className="text-xs text-gray-500">
                            {businessType.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">
                          {formatPrice(businessType.price)}
                        </span>
                        {selectedType === businessType.value && (
                          <CheckCircle className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                    </button>
                  ))}
              </TabsContent>

              <TabsContent value="delivery" className="mt-0 space-y-2">
                {businessTypes
                  .filter((p) => p.category === "delivery")
                  .map((businessType) => (
                    <button
                      key={businessType.value}
                      onClick={() =>
                        handleSelect(businessType.value, businessType.label)
                      }
                      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${
                        selectedType === businessType.value
                          ? "bg-blue-50 border border-blue-200"
                          : "bg-white border border-gray-100 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            selectedType === businessType.value
                              ? "bg-blue-100"
                              : "bg-gray-100"
                          }`}
                        >
                          {businessType.icon}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-sm">
                            {businessType.label}
                          </p>
                          <p className="text-xs text-gray-500">
                            {businessType.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">
                          {formatPrice(businessType.price)}
                        </span>
                        {selectedType === businessType.value && (
                          <CheckCircle className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                    </button>
                  ))}
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter className="flex justify-between p-6 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDone}
              disabled={!selectedType}
              className="rounded-full bg-blue-500 hover:bg-blue-600"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// OTP Verification Component
const OtpCard: React.FC<{
  title: string;
  email?: string;
  onSubmit: (otp: string) => void;
  onResend: () => void;
  loading: boolean;
}> = ({ title, email, onSubmit, onResend, loading }) => {
  const [otp, setOtp] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtp(e.target.value);
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>
          Please enter the verification code sent to{" "}
          <span className="font-medium">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              placeholder="Enter code"
              value={otp}
              onChange={handleChange}
              className="text-center text-lg tracking-widest"
              maxLength={6}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button
          className="w-full"
          disabled={otp.length < 4 || loading}
          onClick={() => onSubmit(otp)}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify"
          )}
        </Button>
        <Button variant="ghost" onClick={onResend} disabled={loading}>
          Resend Code
        </Button>
      </CardFooter>
    </Card>
  );
};

const availableCategories: Categories[] = [
  { value: "tv-4k-samsung", label: "Samsung 4K Smart TV" },
  { value: "laptop-macbook", label: "Apple MacBook Air M2" },
  { value: "headphones-sony", label: "Sony WH-1000XM5 Headphones" },
  { value: "smartphone-pixel", label: "Google Pixel 8 Pro" },
  { value: "console-ps5", label: "PlayStation 5 Console" },
  { value: "camera-canon", label: "Canon EOS R50 Mirrorless Camera" },
  { value: "watch-galaxy", label: "Samsung Galaxy Watch 6" },
  { value: "tablet-ipad", label: "Apple iPad Air 2024" },
  { value: "drone-dji", label: "DJI Mini 4 Pro Drone" },
  { value: "vacuum-dyson", label: "Dyson V15 Detect Vacuum Cleaner" },
  { value: "groceries-weekly", label: "Weekly Grocery Pack" },
  { value: "furniture-desk", label: "Ergonomic Office Desk" },
  { value: "clothing-box", label: "Seasonal Clothing Box" },
  { value: "med-kit", label: "First Aid Medical Kit" },
  { value: "water-pack", label: "24-Pack Bottled Water" },
  { value: "baby-diapers", label: "Baby Diapers (Large Pack)" },
  { value: "pet-food", label: "Premium Pet Food - 10kg" },
  { value: "cleaning-supplies", label: "Household Cleaning Supplies" },
  { value: "books-box", label: "Assorted Book Box" },
  { value: "stationery-set", label: "Office Stationery Set" },
];

// Main Component
export default function ImprovedServiceProvider() {
  const [activeTab, setActiveTab] = useState("personal");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [city, setCity] = useState("");
  const [location, setLocation] = useState("");
  const [businessType, setBusinessType] = useState<string | null>(null);
  const [businessLabel, setBusinessLabel] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
const navigate =useNavigate()
  // Google Maps and location states
  const [coordinates, setCoordinates] = useState<number[]>([]);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState<boolean>(false);
  const [isSearchLoading, setIsSearchLoading] = useState<boolean>(false);
  const [searchValue, setSearchValue] = useState<string>("");
  const [showMap, setShowMap] = useState(false);
  const [isPinDropperActive, setIsPinDropperActive] = useState(false);

  // OTP verification states
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);

  // Google Maps configuration
  const libraries: Libraries = ["places"];
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey,
    libraries,
  });

  // Refs for Google services and map
  const searchInputRef = useRef<HTMLDivElement>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Default map center (you can change this to your preferred location)
  const defaultCenter = { lat: 5.6037, lng: -0.1870 }; // Accra, Ghana

  // Form handling
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      number: "",
      email: "",
      location: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Watch form values to enable form progression
  const watchedName = watch("name");
  const watchedEmail = watch("email");
  const watchedNumber = watch("number");
  const watchedPassword = watch("password");
  const watchedConfirmPassword = watch("confirmPassword");
  const watchedLocation = watch("location");

  // GraphQL mutations
  const [createService] = useMutation(CREATE_SERVICE);
  const [requestOtp] = useMutation(REQUEST_OTP);
  const [verifyOtp] = useMutation(VERIFY_OTP);
  const [resendOTP] = useMutation(RESEND_OTP);

  // Initialize Google services when API is loaded
  useEffect(() => {
    if (!isLoaded || loadError) return;

    try {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      geocoderRef.current = new window.google.maps.Geocoder();
    } catch (error) {
      console.error("Error initializing Google Maps services:", error);
      toast.error("Location services unavailable");
    }
  }, [isLoaded, loadError]);

  // Close predictions when clicking outside search input
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowPredictions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);

    if (value.length > 2 && autocompleteServiceRef.current) {
      setShowPredictions(true);
      fetchPredictions(value);
    } else {
      setPredictions([]);
      setShowPredictions(false);
    }
  };

  // Fetch predictions from Google Places API
  const fetchPredictions = async (input: string) => {
    if (!autocompleteServiceRef.current) return;

    try {
      setIsSearchLoading(true);

      autocompleteServiceRef.current.getPlacePredictions(
        { input },
        (predictions, status) => {
          setIsSearchLoading(false);

          if (
            status !== window.google.maps.places.PlacesServiceStatus.OK ||
            !predictions
          ) {
            setPredictions([]);
            return;
          }

          setPredictions(
            predictions.map((p) => ({
              description: p.description,
              place_id: p.place_id,
              structured_formatting: {
                main_text: p.structured_formatting?.main_text || p.description,
                secondary_text: p.structured_formatting?.secondary_text || "",
              },
            }))
          );
        }
      );
    } catch (error) {
      console.error("Error fetching predictions:", error);
      setIsSearchLoading(false);
      setPredictions([]);
    }
  };

  // Handle prediction selection
  const handlePredictionSelect = (place: PlacePrediction) => {
    setSearchValue(place.description);
    setShowPredictions(false);

    // Update the location form field
    setLocation(place.description);
    setValue("location", place.description);

    // Get coordinates from place_id
    if (geocoderRef.current) {
      geocoderRef.current.geocode(
        { placeId: place.place_id },
        (results, status) => {
          if (
            status === window.google.maps.GeocoderStatus.OK &&
            results &&
            results[0] &&
            results[0].geometry
          ) {
            const lat = results[0].geometry.location.lat();
            const lng = results[0].geometry.location.lng();
            setCoordinates([lng, lat]);
          }
        }
      );
    }
  };

  // Handle map load
  const handleMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
  };

  // Handle pin dropper location selection
  const handlePinDropperLocationSelected = (coords: { lng: number; lat: number }) => {
    setCoordinates([coords.lng, coords.lat]);
    setIsPinDropperActive(false);
    
    // Reverse geocode to get address
    if (geocoderRef.current) {
      geocoderRef.current.geocode(
        { location: { lat: coords.lat, lng: coords.lng } },
        (results, status) => {
          if (status === "OK" && results && results[0]) {
            const address = results[0].formatted_address;
            setSearchValue(address);
            setLocation(address);
            setValue("location", address);
          }
        }
      );
    }
    
    toast.success("Location selected", {
      description: "Location has been set successfully",
    });
  };

  // Handle pin dropper cancel
  const handlePinDropperCancel = () => {
    setIsPinDropperActive(false);
    toast.info("Pin drop cancelled", {
      description: "Location selection was cancelled",
    });
  };

  // Handle file change for profile picture
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];

      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File too large", {
          description: "Image must be less than 5MB in size",
        });
        return;
      }

      // Set the file for upload
      setProfilePic(file);

      // Generate preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewImage(objectUrl);

      console.log("File selected:", file.name, file.type, file.size);
    }
  };

  // Remove profile picture
  const handleRemoveImage = () => {
    setProfilePic(null);
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
      setPreviewImage(null);
    }
  };

  // Add categories
  const handleAddCategories = (categories: string) => {
    if (categories.trim() && !selectedCategories.includes(categories)) {
      setSelectedCategories([...selectedCategories, categories]);
    }
    setInputValue(""); // Clear input after adding
  };

  // Remove categories
  const handleRemoveCategories = (categories: string) => {
    setSelectedCategories(selectedCategories.filter((p) => p !== categories));
  };

  // Update location value when country or city changes
  const updateLocationValue = () => {
    const locationValue =
      selectedCountry && city
        ? `${selectedCountry}-${city}`
        : selectedCountry || city || "";

    setLocation(locationValue);
    setValue("location", locationValue);
  };

  // Handle business type selection
  const handleBusinessTypeSelect = (type: string, label: string) => {
    setBusinessType(type);
    setBusinessLabel(label);
  };

  // Form validation for each step
  const isPersonalInfoComplete = Boolean(
    watchedName &&
      watchedEmail &&
      watchedNumber &&
      !errors.name &&
      !errors.email &&
      !errors.number
  );

  const isProfessionalInfoComplete = Boolean(businessType);

  const isPasswordValid = Boolean(
    watchedPassword &&
      watchedConfirmPassword &&
      watchedPassword === watchedConfirmPassword &&
      !errors.password &&
      !errors.confirmPassword
  );

  // Send OTP
  const handleSendOtp = async (data: FormData) => {
    setIsLoading(true);
    setFormData(data);

    try {
      const result = await requestOtp({
        variables: {
          input: {
            email: data.email,
            name: data.name,
            number: data.number,
            type: "SERVICE",
          },
        },
      });

      if (result.data?.requestOtp?.success) {
        setOtpSent(true);
        setShowOtpVerification(true);
        toast.success("OTP Sent", {
          description: `Verification code sent to ${data.email}`,
        });
      } else {
        toast.error("Error", {
          description:
            result.data?.requestOtp?.message ||
            "Failed to send verification code",
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send verification code";
      toast.error("Error", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async (otpCode: string) => {
    setVerifyingOtp(true);

    try {
      const result = await verifyOtp({
        variables: {
          input: {
            email: formData?.email,
            otp: otpCode,
            type: "SERVICE",
          },
        },
      });

      if (result.data?.verifyOtp?.success && result.data?.verifyOtp?.IsValid) {
        toast.success("Verification Successful", {
          description: "Your email has been verified successfully",
        });


        // Submit the form data after successful verification
        if (formData && formData.password && formData.confirmPassword) {
          submitFormData(formData);
        } else {
          toast.error("Error", {
            description: "Password and Confirm Password are required.",
          });
        }
        navigate(`login`)
      } else {
        toast.error("Verification Failed", {
          description:
            result.data?.verifyOtp?.message || "Invalid verification code",
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Verification failed";
      toast.error("Error", {
        description: errorMessage,
      });
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!formData) return;

    try {
      const result = await resendOTP({
        variables: {
          input: {
            email: formData.email,
            name: formData.name,
            number: formData.number,
            type: "SERVICE",
          },
        },
      });

      if (result.data?.resendOTP?.success) {
        toast.success("OTP Resent", {
          description: `New verification code sent to ${formData.email}`,
        });
      } else {
        toast.error("Error", {
          description:
            result.data?.resendOTP?.message ||
            "Failed to resend verification code",
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to resend verification code";
      toast.error("Error", {
        description: errorMessage,
      });
    }
  };

  // Submit form data
  const submitFormData = async (data: FormData) => {
    setIsLoading(true);

    try {
      // Create an array with the business type and selected categories
      const categoriesArray = businessType
        ? [businessType, ...selectedCategories]
        : selectedCategories;

      const input: CreateServiceInput = {
        name: data.name,
        number: data.number,
        email: data.email,
        location: data.location,
        categories: categoriesArray,
        businessType: businessType || undefined,
        password: data.password!,
        coordinates: coordinates.length === 2 ? coordinates : undefined,
        // You can add H3 indexes here if you have that functionality
        // h3Indexes: helper.generateH3Indexes(coordinates)
      };

      // Create the Apollo upload file
      const fileForUpload = profilePic || null;

      await createService({
        variables: {
          dpfile: fileForUpload,
          input,
        },
      });

      // Reset form and states
      reset();
      setBusinessType(null);
      setBusinessLabel(null);
      setSelectedCountry("");
      setCity("");
      setLocation("");
      setCoordinates([]);
      setSearchValue("");
      setProfilePic(null);
      setSelectedCategories([]);
      setInputValue("");
      setShowOtpVerification(false);
      setOtpSent(false);
      setFormData(null);
      setShowMap(false);
      setIsPinDropperActive(false);

      if (previewImage) {
        URL.revokeObjectURL(previewImage);
        setPreviewImage(null);
      }

      toast.success("Success!", {
        description: "Service provider profile created successfully.",
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      toast.error("Error", {
        description: errorMessage,
      });
      console.error("Error submitting form:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Form submission
  const onSubmit = async (data: FormData) => {
    // Check if password and confirm password match
    if (data.password !== data.confirmPassword) {
      toast.error("Error", {
        description: "Passwords do not match",
      });
      return;
    }

    // Initiate OTP verification process
    await handleSendOtp(data);
  };

  // Cancel OTP verification
  const handleCancelOtp = () => {
    setShowOtpVerification(false);
    setOtpSent(false);
  };

  // Setup Apollo client for file uploads
  useEffect(() => {
    // This effect ensures we're properly set up for file uploads with Apollo
    // We can add cleanup if needed
    return () => {
      // Cleanup any file URLs
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, []);

  return (
    <div className="py-8 w-full">
      <div className="px-4 py-8 mx-auto">
        <div className="max-w-3xl mx-auto">
          {showOtpVerification ? (
            <div className="space-y-6">
              <OtpCard
                title="Email Verification"
                email={formData?.email}
                onSubmit={handleVerifyOtp}
                onResend={handleResendOtp}
                loading={verifyingOtp}
              />

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={handleCancelOtp}
                  disabled={verifyingOtp}
                >
                  Back to Form
                </Button>
              </div>
            </div>
          ) : (
            <Card className="w-full shadow-lg border-0">
              <CardHeader className="border-b border-gray-50 rounded-t-lg">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Briefcase className="h-6 w-6 text-primary" />
                  Create Service Provider Profile
                </CardTitle>
                <CardDescription>
                  Fill out the information below to create your professional
                  profile
                </CardDescription>
              </CardHeader>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <div className="px-6 pt-6">
                  <TabsList className="grid w-full grid-cols-3 mb-6 h-14">
                    <TabsTrigger
                      value="personal"
                      className="flex gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">Personal Info</span>
                      <span className="sm:hidden">Info</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="professional"
                      className="flex gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      disabled={!isPersonalInfoComplete}
                    >
                      <Briefcase className="h-4 w-4" />
                      <span className="hidden sm:inline">Professional</span>
                      <span className="sm:hidden">Prof.</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="account"
                      className="flex gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      disabled={
                        !isPersonalInfoComplete || !isProfessionalInfoComplete
                      }
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">Security</span>
                      <span className="sm:hidden">Secure</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <CardContent>
                  <form id="service-form" onSubmit={handleSubmit(onSubmit)}>
                    {/* Personal Info Tab */}
                    <TabsContent value="personal" className="mt-0 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label
                            htmlFor="name"
                            className={`flex items-center gap-2 ${
                              errors.name ? "text-destructive" : ""
                            }`}
                          >
                            <User className="h-4 w-4" />
                            Full Name / Business Name
                          </Label>
                          <Input
                            id="name"
                            placeholder="Enter your name or business name"
                            {...register("name", {
                              required: "Name is required",
                            })}
                            className={errors.name ? "border-destructive" : ""}
                          />
                          {errors.name && (
                            <p className="text-sm text-destructive">
                              {errors.name.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="email"
                            className={`flex items-center gap-2 ${
                              errors.email ? "text-destructive" : ""
                            }`}
                          >
                            <Mail className="h-4 w-4" />
                            Email Address
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="example@example.com"
                            {...register("email", {
                              required: "Email is required",
                              pattern: {
                                value:
                                  /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: "Invalid email address",
                              },
                            })}
                            className={errors.email ? "border-destructive" : ""}
                          />
                          {errors.email && (
                            <p className="text-sm text-destructive">
                              {errors.email.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="number"
                            className={`flex items-center gap-2 ${
                              errors.number ? "text-destructive" : ""
                            }`}
                          >
                            <Phone className="h-4 w-4" />
                            Phone Number
                          </Label>
                          <Input
                            id="number"
                            placeholder="Enter your phone number"
                            {...register("number", {
                              required: "Phone number is required",
                              pattern: {
                                value: /^[0-9+ -]+$/,
                                message: "Invalid phone number format",
                              },
                            })}
                            className={
                              errors.number ? "border-destructive" : ""
                            }
                          />
                          {errors.number && (
                            <p className="text-sm text-destructive">
                              {errors.number.message}
                            </p>
                          )}
                        </div>

                        {/* Location Section */}
                        <div className="space-y-2 md:col-span-2">
                          <Label
                            htmlFor="location-display"
                            className={`flex items-center gap-2 ${
                              errors.location ? "text-destructive" : ""
                            }`}
                          >
                            <MapPin className="h-4 w-4" />
                            Location / Service Area
                          </Label>
                          
                          {/* Location Search */}
                          <div className="space-y-4">
                            <div className="relative" ref={searchInputRef}>
                              <Input
                                id="location"
                                placeholder="Search for your location"
                                value={searchValue}
                                onChange={handleSearchChange}
                                className="pr-10"
                              />
                              {searchValue && (
                                <button
                                  type="button"
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                  onClick={() => {
                                    setSearchValue("");
                                    setValue("location", "");
                                    setCoordinates([]);
                                  }}
                                >
                                  <X size={16} />
                                </button>
                              )}

                              {/* Predictions dropdown */}
                              {showPredictions &&
                                predictions.length > 0 &&
                                !loadError && (
                                  <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                                    {isSearchLoading ? (
                                      <div className="p-3 text-center text-sm text-gray-500">
                                        <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" />
                                        Searching...
                                      </div>
                                    ) : (
                                      <ul className="py-1">
                                        {predictions.map((place) => (
                                          <li
                                            key={place.place_id}
                                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                            onClick={() =>
                                              handlePredictionSelect(place)
                                            }
                                          >
                                            <div className="font-medium text-sm">
                                              {
                                                place.structured_formatting
                                                  .main_text
                                              }
                                            </div>
                                            <div className="text-xs text-gray-500">
                                              {
                                                place.structured_formatting
                                                  .secondary_text
                                              }
                                            </div>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                )}
                            </div>

                            {/* Map Toggle Button */}
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowMap(!showMap)}
                                className="flex items-center gap-2"
                                disabled={!isLoaded}
                              >
                                <Map className="h-4 w-4" />
                                {showMap ? "Hide Map" : "Show Map"}
                              </Button>
                              
                              {showMap && (
                                <Button
                                  type="button"
                                  variant="default"
                                  onClick={() => setIsPinDropperActive(true)}
                                  className="flex items-center gap-2"
                                  disabled={!mapRef.current}
                                >
                                  <MapPin className="h-4 w-4" />
                                  Drop Pin
                                </Button>
                              )}
                            </div>

                            {/* Google Map */}
                            {showMap && isLoaded && (
                              <div className="h-[400px] w-full rounded-lg border border-gray-200 relative overflow-hidden">
                                <GoogleMap
                                  mapContainerStyle={{ width: "100%", height: "100%" }}
                                  center={
                                    coordinates.length === 2
                                      ? { lat: coordinates[1], lng: coordinates[0] }
                                      : defaultCenter
                                  }
                                  zoom={13}
                                  onLoad={handleMapLoad}
                                  options={{
                                    disableDefaultUI: false,
                                    zoomControl: true,
                                    streetViewControl: false,
                                    mapTypeControl: false,
                                    fullscreenControl: false,
                                  }}
                                />
                                
                                {/* Pin Dropper Overlay */}
                                {isPinDropperActive && mapRef.current && (
                                  <GoogleMapPinDropper
                                    map={mapRef.current}
                                    onLocationSelected={handlePinDropperLocationSelected}
                                    onCancel={handlePinDropperCancel}
                                  />
                                )}
                              </div>
                            )}

                            {/* Location confirmation */}
                            {watchedLocation && coordinates.length === 2 && (
                              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 space-y-2">
                                <div className="flex items-center">
                                  <CheckCircle className="h-5 w-5 text-blue-500 mr-2" />
                                  <h3 className="font-medium">Location Confirmed</h3>
                                </div>
                                <p className="text-sm text-gray-600">
                                  {watchedLocation}
                                </p>
                                <div className="text-xs text-gray-500">
                                  Coordinates: {coordinates[1].toFixed(6)},{" "}
                                  {coordinates[0].toFixed(6)}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Hidden input to store location value */}
                          <Input type="hidden" {...register("location")} />
                          {errors.location && (
                            <p className="text-sm text-destructive">
                              {errors.location.message}
                            </p>
                          )}
                        </div>
                      </div>

                      {isPersonalInfoComplete && (
                        <div className="flex justify-end mt-6">
                          <Button
                            type="button"
                            onClick={() => setActiveTab("professional")}
                            className="flex items-center gap-2"
                          >
                            Continue to Professional Info
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="lucide lucide-chevron-right"
                            >
                              <path d="m9 18 6-6-6-6" />
                            </svg>
                          </Button>
                        </div>
                      )}
                    </TabsContent>

                    {/* Professional Info Tab */}
                    <TabsContent
                      value="professional"
                      className="mt-0 space-y-6"
                    >
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <Label className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4" />
                              Business Type
                            </Label>
                            {businessType && (
                              <Badge variant="outline" className="text-xs">
                                {businessLabel}
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-1 gap-4">
                            <BusinessTypeSelector
                              onSelect={handleBusinessTypeSelect}
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <Label className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              Products / Services Offered
                            </Label>
                            {selectedCategories.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {selectedCategories.length} selected
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Select Dropdown */}
                            <div>
                              <Select onValueChange={handleAddCategories}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select a product" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableCategories.map((categories) => (
                                    <SelectItem
                                      key={categories.value}
                                      value={categories.value}
                                      disabled={selectedCategories.includes(
                                        categories.value
                                      )}
                                    >
                                      {categories.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Manual Input for Custom Products */}
                            <div className="relative">
                              <Input
                                type="text"
                                placeholder="Type a custom product and press Enter"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddCategories(inputValue);
                                  }
                                }}
                                onBlur={() => {
                                  if (inputValue.trim()) {
                                    handleAddCategories(inputValue);
                                  }
                                }}
                              />
                              {inputValue && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                                  onClick={() =>
                                    handleAddCategories(inputValue)
                                  }
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="lucide lucide-plus"
                                  >
                                    <path d="M5 12h14" />
                                    <path d="M12 5v14" />
                                  </svg>
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Display Selected Products */}
                          <div className="rounded-lg p-4 min-h-24 bg-gray-50">
                            {selectedCategories.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {selectedCategories.map((categories) => {
                                  const categoriesLabel =
                                    availableCategories.find(
                                      (p) => p.value === categories
                                    )?.label || categories;
                                  return (
                                    <Badge
                                      key={categories}
                                      variant="secondary"
                                      className="pl-2 pr-1 py-1 text-sm"
                                    >
                                      {categoriesLabel}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-4 w-4 p-0 ml-1"
                                        onClick={() =>
                                          handleRemoveCategories(categories)
                                        }
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </Badge>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-center text-gray-500 py-2">
                                <p className="text-sm">
                                  No products selected yet
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <Label className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Profile Picture
                          </Label>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                            <div
                              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors ${
                                previewImage
                                  ? "border-primary"
                                  : "border-gray-300"
                              }`}
                              onClick={() =>
                                document
                                  .getElementById("profile-picture")
                                  ?.click()
                              }
                            >
                              <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                              <p className="text-sm font-medium">
                                {previewImage
                                  ? "Change picture"
                                  : "Upload profile picture"}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Supported formats: JPG, PNG, WebP (Max 5MB)
                              </p>
                              <Input
                                id="profile-picture"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                              />
                            </div>

                            {previewImage ? (
                              <div className="flex flex-col items-center space-y-3">
                                <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-primary shadow-md">
                                  <img
                                    src={previewImage}
                                    alt="Profile Preview"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  onClick={handleRemoveImage}
                                >
                                  <X className="h-3 w-3 mr-1" />
                                  Remove
                                </Button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center">
                                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                                  <User className="h-12 w-12 text-gray-400" />
                                </div>
                                <p className="text-xs text-gray-500 mt-3">
                                  No image selected
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between mt-6">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setActiveTab("personal")}
                            className="flex items-center gap-2"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="lucide lucide-chevron-left"
                            >
                              <path d="m15 18-6-6 6-6" />
                            </svg>
                            Back
                          </Button>
                          <Button
                            type="button"
                            onClick={() => setActiveTab("account")}
                            disabled={!businessType}
                            className="flex items-center gap-2"
                          >
                            Continue to Security
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="lucide lucide-chevron-right"
                            >
                              <path d="m9 18 6-6-6-6" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Security Tab */}
                    <TabsContent value="account" className="mt-0 space-y-6">
                      <Alert className="bg-blue-50 text-blue-800 border-blue-200 mb-6">
                        <AlertDescription className="flex items-center gap-2 text-sm">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-shield-check"
                          >
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                            <path d="m9 12 2 2 4-4" />
                          </svg>
                          Create a strong password to secure your service
                          provider account.
                        </AlertDescription>
                      </Alert>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 relative">
                          <Label
                            htmlFor="password"
                            className={`flex items-center gap-2 ${
                              errors.password ? "text-destructive" : ""
                            }`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="lucide lucide-key"
                            >
                              <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
                            </svg>
                            Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a secure password"
                              {...register("password", {
                                required: "Password is required",
                                minLength: {
                                  value: 8,
                                  message:
                                    "Password must be at least 8 characters",
                                },
                              })}
                              className={
                                errors.password ? "border-destructive" : ""
                              }
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((prev) => !prev)}
                              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                            >
                              {showPassword ? (
                                <EyeOff size={20} />
                              ) : (
                                <Eye size={20} />
                              )}
                            </button>
                          </div>
                          {errors.password && (
                            <p className="text-sm text-destructive">
                              {errors.password.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2 relative">
                          <Label
                            htmlFor="confirmPassword"
                            className={`flex items-center gap-2 ${
                              errors.confirmPassword ? "text-destructive" : ""
                            }`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="lucide lucide-check-circle"
                            >
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                              <path d="m9 11 3 3L22 4" />
                            </svg>
                            Confirm Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm your password"
                              {...register("confirmPassword", {
                                required: "Please confirm your password",
                                validate: (value) =>
                                  value === watchedPassword ||
                                  "Passwords do not match",
                              })}
                              className={
                                errors.confirmPassword
                                  ? "border-destructive"
                                  : ""
                              }
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowConfirmPassword((prev) => !prev)
                              }
                              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                            >
                              {showConfirmPassword ? (
                                <EyeOff size={20} />
                              ) : (
                                <Eye size={20} />
                              )}
                            </button>
                          </div>
                          {errors.confirmPassword && (
                            <p className="text-sm text-destructive">
                              {errors.confirmPassword.message}
                            </p>
                          )}
                        </div>
                      </div>

                      {watchedPassword && watchedPassword.length >= 8 && (
                        <div className="mt-4">
                          <div className="flex items-center space-x-2">
                            <div className="bg-green-100 text-green-800 rounded-full p-1">
                              <CheckCircle className="h-4 w-4" />
                            </div>
                            <span className="text-sm text-green-800">
                              Password meets minimum length requirement
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between mt-6">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setActiveTab("professional")}
                          className="flex items-center gap-2"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-chevron-left"
                          >
                            <path d="m15 18-6-6 6-6" />
                          </svg>
                          Back
                        </Button>
                        <Button
                          type="submit"
                          disabled={isLoading || !isPasswordValid}
                          className="min-w-[140px]"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Complete Setup
                            </>
                          )}
                        </Button>
                      </div>
                    </TabsContent>
                  </form>
                </CardContent>
              </Tabs>

              <CardFooter className="flex justify-between border-t p-6 rounded-b-lg">
                <Button
                  variant="outline"
                  onClick={() => {
                    reset();
                    setBusinessType(null);
                    setBusinessLabel(null);
                    setSelectedCountry("");
                    setCity("");
                    setLocation("");
                    setCoordinates([]);
                    setSearchValue("");
                    setProfilePic(null);
                    setSelectedCategories([]);
                    setInputValue("");
                    setShowMap(false);
                    setIsPinDropperActive(false);
                    if (previewImage) {
                      URL.revokeObjectURL(previewImage);
                      setPreviewImage(null);
                    }
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>

                <div className="text-sm text-gray-500">
                  Already have an account?{" "}
                  <a
                    href="/login"
                    className="text-primary font-medium hover:underline"
                  >
                    Sign in here
                  </a>
                </div>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { LocationStep } from "./location-step";
import { TransportStep } from "./components/transport-step";
import { ResultStep } from "./result-step";
import { Card } from "@/components/ui/card";
import { StepIndicator } from "./components/step-indicator";
import { useMutation, gql, useQuery } from "@apollo/client";
import { useAuth } from "@/middleware/context/authContext";
import { GET_PROVIDER } from "./mapsWork/RiderDeliverySys/create";
import ZoneConfigStep from "./components/zone-config-step";
// GraphQL mutation for isochrones - simplified to match first example
export const GENERATE_ISOCHRONE = gql`
  mutation GenerateIsochrone($input: IsochroneInput!) {
    generateIsochrone(input: $input) {
      geojson
      id
      locations
      range
      metaData {
        zone
        id
        price
        duration
        distance
      }
    }
  }
`;

type Location = {
  address: string;
  lat: number;
  lng: number;
  placeId?: string;
};

type TransportMode = "walking" | "bike" | "motorbike" | "car";
type RangeType = "time" | "distance";

// Conversion speeds in km/h (same as first example)
const SPEED_MAPPING = {
  walking: 5,
  bike: 15,
  motorbike: 30,
  car: 60,
};

// Extended support - up to 5 hours for car/motorbike (configurable)
const EXTENDED_MAX_RANGES = {
  walking: 5 * 3600, // 5 hours in seconds
  bike: 5 * 3600, // 5 hours in seconds
  motorbike: 5 * 3600, // 5 hours in seconds
  car: 5 * 3600, // 5 hours in seconds
};

export function VendorProcessFlow({ serviceId }: { serviceId: string }) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [location, setLocation] = useState<Location | null>(null);
  const [transportMode, setTransportMode] = useState<TransportMode>("car");
  const [rangeType, setRangeType] = useState<RangeType>("distance");
  const [ranges, setRanges] = useState<number[]>([10, 20, 30]);
  const [rangePrices, setRangePrices] = useState<number[]>([0, 5.0, 7.5]); // Add pricing state
  const [isochrones, setIsochrones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extendedMode, setExtendedMode] = useState(false); // Re-add extended mode
  const [vendorLocation, setVendorLocation] = useState<Location | null>(null);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [retryTimer, setRetryTimer] = useState<NodeJS.Timeout | null>(null);

  const riderId = user?.id;

  // Fetch provider data
  const {
    data,
    loading,
    error: providerError,
  } = useQuery(GET_PROVIDER, {
    variables: { serviceId },
  });

  // Apollo Client mutation hook
  const [generateIsochrone] = useMutation(GENERATE_ISOCHRONE);

  // Process vendor location when provider data is loaded
  useEffect(() => {
    if (data?.getProvider) {
      const provider = data.getProvider;

      // Handle provider coordinates (same logic as first example)
      let lat = 0,
        lng = 0;
      if (
        Array.isArray(provider.coordinates) &&
        provider.coordinates.length === 2
      ) {
        [lng, lat] = provider.coordinates;
      } else if (
        provider.coordinates &&
        typeof provider.coordinates === "object"
      ) {
        lat = provider.coordinates.lat ?? 0;
        lng = provider.coordinates.lng ?? 0;
      }

      // Create vendor location object
      const vendorLoc: Location = {
        address: provider.location || "Unknown address",
        lat,
        lng,
        placeId: provider.id || "unknown",
      };

      setVendorLocation(vendorLoc);

      // Auto-set as the initial location if no location is selected yet
      if (!location && lat !== 0 && lng !== 0) {
        setLocation(vendorLoc);
      }
    }
  }, [data, location]);

  const handleLocationSelect = (selectedLocation: Location) => {
    setLocation(selectedLocation);
  };

  const handleTransportSelect = (mode: TransportMode) => {
    setTransportMode(mode);

    // Update default ranges based on transport mode and current range type
    if (rangeType === "distance") {
      let newDistanceRanges: number[] = [10, 20, 30];
      let newPrices: number[] = [0, 5.0, 7.5];

      if (mode === "walking") {
        newDistanceRanges = extendedMode ? [1, 3, 5, 10] : [1, 2, 4];
        newPrices = extendedMode ? [0, 3.0, 5.0, 7.0] : [0, 3.0, 5.0];
      } else if (mode === "bike") {
        newDistanceRanges = extendedMode ? [3, 10, 20, 40] : [3, 5, 8];
        newPrices = extendedMode ? [0, 4.0, 6.0, 10.0] : [0, 4.0, 6.0];
      } else if (mode === "motorbike") {
        newDistanceRanges = extendedMode ? [5, 15, 30, 60] : [5, 10, 15];
        newPrices = extendedMode ? [0, 5.0, 8.0, 12.0] : [0, 5.0, 8.0];
      } else if (mode === "car") {
        newDistanceRanges = extendedMode ? [10, 30, 60, 120] : [10, 20, 30];
        newPrices = extendedMode ? [0, 6.0, 10.0, 15.0] : [0, 6.0, 10.0];
      }

      setRanges(newDistanceRanges);
      setRangePrices(newPrices);
    } else {
      // Time ranges - For extended mode, allow longer times
      if (extendedMode) {
        if (mode === "walking" || mode === "bike") {
          setRanges([15, 30, 60, 120]); // Up to 2 hours
          setRangePrices([0, 3.0, 5.0, 8.0]);
        } else {
          setRanges([30, 60, 120, 180]); // Up to 3 hours
          setRangePrices([0, 5.0, 8.0, 12.0]);
        }
      } else {
        // Standard ranges (capped at 60 min)
        if (mode === "walking" || mode === "bike") {
          setRanges([10, 20, 30]);
          setRangePrices([0, 3.0, 5.0]);
        } else {
          setRanges([15, 30, 45]);
          setRangePrices([0, 5.0, 8.0]);
        }
      }
    }
  };

  const handleRangeTypeChange = (type: RangeType) => {
    setRangeType(type);

    // Convert current ranges to the new type
    if (type === "distance" && rangeType === "time") {
      // Convert from time (minutes) to distance (km)
      const speed = SPEED_MAPPING[transportMode];
      const newRanges = ranges.map((time) => {
        return Math.round((time / 60) * speed * 10) / 10;
      });
      setRanges(newRanges);
    } else if (type === "time" && rangeType === "distance") {
      // Convert from distance (km) to time (minutes)
      const speed = SPEED_MAPPING[transportMode];
      const newRanges = ranges.map((distance) => {
        return Math.round((distance / speed) * 60);
      });

      // Apply appropriate time caps based on extended mode
      if (extendedMode) {
        const maxMinutes = EXTENDED_MAX_RANGES[transportMode] / 60;
        const cappedRanges = newRanges.map((time) =>
          Math.min(time, maxMinutes)
        );
        setRanges(cappedRanges);
      } else {
        // Cap at 60 minutes (API limit)
        const cappedRanges = newRanges.map((time) => Math.min(time, 60));
        setRanges(cappedRanges);
      }
    }
  };

  const handleRangesChange = (newRanges: number[]) => {
    // If time-based, ensure ranges don't exceed configured limits
    if (rangeType === "time") {
      const maxMinutes = extendedMode
        ? EXTENDED_MAX_RANGES[transportMode] / 60
        : 60; // Standard API limit

      const cappedRanges = newRanges.map((time) => Math.min(time, maxMinutes));
      setRanges(cappedRanges);
    } else {
      setRanges(newRanges);
    }
  };

  const handleRangePricesChange = (newPrices: number[]) => {
    setRangePrices(newPrices);
  };

  const toggleExtendedMode = (enabled: boolean) => {
    setExtendedMode(enabled);

    // Update ranges based on new mode
    if (enabled) {
      // Expand ranges for extended mode
      if (rangeType === "distance") {
        let extendedRanges: number[] = [...ranges];
        let extendedPrices: number[] = [...rangePrices];

        // Add a longer range if not already present
        if (transportMode === "walking") {
          if (Math.max(...ranges) < 8) {
            extendedRanges.push(10);
            extendedPrices.push(7.0);
          }
        } else if (transportMode === "bike") {
          if (Math.max(...ranges) < 30) {
            extendedRanges.push(40);
            extendedPrices.push(10.0);
          }
        } else if (transportMode === "motorbike" || transportMode === "car") {
          if (Math.max(...ranges) < 100) {
            extendedRanges.push(120);
            extendedPrices.push(15.0);
          }
        }

        setRanges(extendedRanges);
        setRangePrices(extendedPrices);
      } else {
        // Time-based ranges
        let extendedRanges: number[] = [...ranges];
        let extendedPrices: number[] = [...rangePrices];

        // Add longer time ranges if not already present
        const maxCurrentMinutes = Math.max(...ranges);
        if (maxCurrentMinutes < 90) {
          extendedRanges.push(120); // 2 hours
          extendedPrices.push(10.0);
        }
        if (
          maxCurrentMinutes < 150 &&
          (transportMode === "car" || transportMode === "motorbike")
        ) {
          extendedRanges.push(180); // 3 hours for faster transport
          extendedPrices.push(15.0);
        }

        setRanges(extendedRanges);
        setRangePrices(extendedPrices);
      }
    } else {
      // Revert to standard mode with API limits
      const standardRanges = ranges.filter((val, index) => {
        if (rangeType === "time") {
          return val <= 60; // Only keep ranges under 60 minutes
        } else {
          // For distance, estimate based on transport speed
          const speed = SPEED_MAPPING[transportMode];
          const timeInMinutes = (val / speed) * 60;
          return timeInMinutes <= 60;
        }
      });

      // Filter corresponding prices
      const standardPrices = rangePrices.slice(0, standardRanges.length);

      // Ensure we have at least some ranges left
      if (standardRanges.length < 2) {
        handleTransportSelect(transportMode); // Reset to defaults
      } else {
        setRanges(standardRanges);
        setRangePrices(standardPrices);
      }
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Convert ranges to time ranges (in seconds) for the API
  const getTimeRangesForApi = (): number[] => {
    if (rangeType === "time") {
      // Apply appropriate caps based on mode
      const maxMinutes = extendedMode
        ? EXTENDED_MAX_RANGES[transportMode] / 60
        : 60; // Standard API limit

      return ranges.map((time) => Math.min(time, maxMinutes));
    } else {
      // Convert from distance to time
      const speed = SPEED_MAPPING[transportMode];
      const timeRanges = ranges.map((distance) => {
        return Math.round((distance / speed) * 60);
      });

      // Apply appropriate caps
      const maxMinutes = extendedMode
        ? EXTENDED_MAX_RANGES[transportMode] / 60
        : 60;

      return timeRanges.map((time) => Math.min(time, maxMinutes));
    }
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 4000);
  };

  const showSuccess = (message: string) => {
    // Create iOS-style success notification (same as first example)
    const alertDiv = document.createElement("div");
    alertDiv.className =
      "fixed top-4 left-1/2 transform -translate-x-1/2 bg-[#34c759] text-white px-6 py-3 rounded-2xl shadow-lg z-50 font-medium text-sm";
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
      alertDiv.remove();
    }, 3000);
  };

  const cancelRetry = () => {
    if (retryTimer) {
      clearTimeout(retryTimer);
      setRetryTimer(null);
    }
    setRetryCount(0);
    setIsLoading(false);
  };

  const generateIsochrones = async () => {
    if (!location || !vendorLocation) {
      showError("Please select a location first");
      return;
    }

    // Clear any existing retry timer
    if (retryTimer) {
      clearTimeout(retryTimer);
      setRetryTimer(null);
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get time ranges in minutes and convert to seconds
      const timeRanges = getTimeRangesForApi();

      // For now, we'll use 60 minute cap for the initial isochrone
      // The extension functionality will handle adding more points
      const cappedRanges = timeRanges.map((time) => Math.min(time, 60));

      // Convert minutes to seconds for the API
      const rangesInSeconds = cappedRanges.map((minutes) => minutes * 60);

      console.log("Time ranges for API (seconds):", rangesInSeconds);

      if (rangeType === "distance") {
        console.log("Distance to time conversion:", {
          distances: ranges,
          times: timeRanges,
        });
      }

      // Create metadata for each range (including pricing)
      const metaData = ranges.map((range, index) => ({
        price: rangePrices[index] || (index === 0 ? 0 : 3 + index * 2), // Use stored prices
      }));

      // Helper function to get estimated distance from time
      function getEstimatedDistance(time: number, mode: TransportMode): number {
        const speed = SPEED_MAPPING[mode];
        return Math.round((time / 60) * speed * 10) / 10; // Convert to km with 1 decimal
      }

      // Execute GraphQL query using vendor location
      const response = await generateIsochrone({
        variables: {
          input: {
            locations: [[vendorLocation.lng, vendorLocation.lat]], // Use vendor coordinates
            range: rangesInSeconds,
            transportMode: transportMode,
            address: vendorLocation.address,
            vendorId: data?.getProvider?.id || "vendor_unknown",
            metaData: metaData,
          },
        },
      });

      // Reset retry counter on success
      setRetryCount(0);

      if (response?.data?.generateIsochrone?.geojson) {
        // Parse the GeoJSON string returned from the API
        const geojsonData = JSON.parse(response.data.generateIsochrone.geojson);

        if (geojsonData?.features) {
          // Process isochrones with colors (like first example)
          const zoneColors = [
            "#34c759", // green
            "#ffcc00", // yellow
            "#ff3b30", // red
            "#007aff", // blue
            "#af52de", // purple
            "#ff2d55", // pink
          ];

          const processedIsochrones = geojsonData.features.map(
            (feature: any, index: number) => ({
              ...feature,
              id: `iso_${index}`,
              distance: ranges[index],
              price: metaData[index].price,
              color: zoneColors[index % zoneColors.length],
              properties: {
                ...feature.properties,
                zone: index + 1,
                color: zoneColors[index % zoneColors.length],
              },
            })
          );

          setIsochrones(processedIsochrones);
          setGeneratedData(response.data.generateIsochrone);
          nextStep(); // Move to results step

          showSuccess("Zones generated successfully!");
        } else {
          throw new Error("Invalid GeoJSON format received");
        }
      } else {
        throw new Error("No valid isochrone data received");
      }
    } catch (error: any) {
      console.error("Error generating isochrones:", error);

      let errorMessage = "Failed to generate delivery zones. Please try again.";

      if (
        error?.message?.includes("Service Unavailable") ||
        error?.message?.includes("503")
      ) {
        errorMessage =
          "The mapping service is temporarily unavailable. Please try again in a few moments.";

        // Implement retry logic (like first example)
        const maxRetries = 3;

        if (retryCount < maxRetries) {
          const newRetryCount = retryCount + 1;
          setRetryCount(newRetryCount);

          const delay = Math.pow(2, newRetryCount) * 1000; // 2s, 4s, 8s

          setError(
            `The mapping service is temporarily busy. Retrying in ${
              delay / 1000
            } seconds... (Attempt ${newRetryCount}/${maxRetries})`
          );

          const timer = setTimeout(() => {
            generateIsochrones();
          }, delay);

          setRetryTimer(timer);
        } else {
          setError(
            "The mapping service is currently unavailable. Please try again later."
          );
          setIsLoading(false);
        }
      } else if (error?.networkError) {
        errorMessage =
          "Network error. Please check your connection and try again.";
        setIsLoading(false);
      } else if (error?.graphQLErrors?.length > 0) {
        errorMessage = error.graphQLErrors[0].message;
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }

      if (!retryTimer) {
        showError(errorMessage);
      }
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f2f2f7]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 relative">
            <div className="absolute inset-0 rounded-full border-3 border-[#007aff] border-t-transparent animate-spin"></div>
          </div>
          <p className="text-[#1d1d1f] font-medium">
            Loading vendor information...
          </p>
          <p className="text-xs text-[#86868b]">
            Please wait while we fetch your details
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (providerError) {
    return (
      <div className="min-h-screen bg-[#f2f2f7] flex items-center justify-center p-4">
        <div className="max-w-md bg-white rounded-2xl shadow-sm border border-[#ff3b30]/20 p-6 text-center">
          <div className="w-12 h-12 bg-[#ff3b30]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="h-6 w-6 text-[#ff3b30]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-[#1d1d1f] mb-2">
            Unable to Load Vendor
          </h3>
          <p className="text-[#ff3b30] text-sm">{providerError.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-[#007aff] text-white px-4 py-2 rounded-xl text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StepIndicator currentStep={currentStep} totalSteps={4} />

      <Card className="overflow-hidden border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm bg-white dark:bg-[#2C2C2E]">
        {currentStep === 1 && (
          <LocationStep
            onLocationSelect={handleLocationSelect}
            selectedLocation={location}
            onNext={nextStep}
            vendorLocation={vendorLocation}
          />
        )}

        {currentStep === 2 && (
          <TransportStep
            selectedMode={transportMode}
            onTransportSelect={handleTransportSelect}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}

        {currentStep === 3 && (
          <ZoneConfigStep
            transportMode={transportMode}
            rangeType={rangeType}
            onRangeTypeChange={handleRangeTypeChange}
            ranges={ranges}
            rangePrices={rangePrices}
            onRangesChange={handleRangesChange}
            onRangePricesChange={handleRangePricesChange}
            onGenerate={generateIsochrones}
            onBack={prevStep}
            isLoading={isLoading}
            extendedMode={extendedMode}
            onExtendedModeChange={toggleExtendedMode}
            maxExtendedTimeMinutes={EXTENDED_MAX_RANGES[transportMode] / 60}
          />
        )}

        {currentStep === 4 && (
          <ResultStep
            location={vendorLocation || location}
            transportMode={transportMode}
            rangeType={rangeType}
            ranges={ranges}
            rangePrices={rangePrices}
            timeRanges={rangeType === "time" ? ranges : getTimeRangesForApi()}
            isochrones={isochrones}
            onBack={() => {
              cancelRetry();
              prevStep();
            }}
            nextStep={nextStep}
            error={error}
            extendedMode={extendedMode}
            onRetry={isLoading ? cancelRetry : generateIsochrones}
            isRetrying={isLoading && retryCount > 0}
          />
        )}
      </Card>
    </div>
  );
}

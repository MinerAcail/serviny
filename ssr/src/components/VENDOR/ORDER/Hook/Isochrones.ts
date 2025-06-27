import { useState, useCallback } from "react";
import { gql, useQuery } from "@apollo/client";
import { toast } from "sonner";

// Define the GraphQL query for getting all isochrones by vendor
export const GET_ISOCHRONES_BY_VENDOR = gql`
  query GetAllIsochronesByVendor($vendorId: String!) {
    getAllIsochronesByVendor(vendorId: $vendorId) {
      riders {
        rider {
          id
          name
          email
          dpfile
          availability
          coordinates
          experience
        }
        riderService {
          id
          name
          email
          dpfile
          coordinates
        }
        mapData {
          id
          geojson
          range
          transportMode
          address
          locations
          metaData {
            id
            price
            duration
            distance
            zone
          }
        }
      }
    }
  }
`;

// Define the GraphQL query for closest isochrone (keeping for compatibility)
export const GET_CLOSEST_ISOCHRONE = gql`
  query GetClosestIsochroneForLocation(
    $riderId: String!
    $location: [Float!]!
  ) {
    getClosestIsochroneForLocation(riderId: $riderId, location: $location) {
      id
      geojson
      range
      transportMode
      address
      locations
      metaData {
        id
        price
        duration
        distance
        zone
      }
    }
  }
`;

// Type definitions
export interface RiderInfo {
  id: string;
  name: string;
  email: string;
  dpfile?: string;
  availability?: boolean;
  coordinates?: number[];
  experience?: string;
}

export interface RiderServiceInfo {
  id: string;
  name: string;
  email: string;
  dpfile?: string;
  coordinates?: number[];
}

// Combined rider type that merges rider and riderService
export interface CombinedRiderInfo {
  id: string;
  name: string;
  email: string;
  dpfile?: string;
  availability?: boolean;
  coordinates?: number[];
  experience?: string;
  // Service-specific fields (prefixed to avoid conflicts)
  serviceId?: string;
  serviceName?: string;
  serviceEmail?: string;
  serviceDpfile?: string;
  serviceCoordinates?: number[];
  // Flag to indicate data source
  hasRiderData: boolean;
  hasServiceData: boolean;
}

export interface IsochroneMetaData {
  id: string;
  price: number;
  duration: number;
  distance: number;
  zone: number;
}

export interface IsochroneData {
  id: string;
  geojson: string;
  range: number[];
  transportMode?: string;
  address?: string;
  locations?: number[][];
  metaData?: IsochroneMetaData[];
}

export interface RiderWithMapData {
  rider?: RiderInfo;
  riderService?: RiderServiceInfo;
  mapData: IsochroneData[];
}

export interface VendorMapData {
  riders: RiderWithMapData;
}

// Helper function to combine rider and riderService data
const combineRiderData = (rider?: RiderInfo, riderService?: RiderServiceInfo): CombinedRiderInfo => {
  // Use rider data as primary, fallback to riderService data
  const primaryData = rider || riderService;
  
  if (!primaryData) {
    throw new Error("No rider or riderService data available");
  }

  return {
    // Primary data (prefer rider over riderService)
    id: rider?.id || riderService?.id || '',
    name: rider?.name || riderService?.name || '',
    email: rider?.email || riderService?.email || '',
    dpfile: rider?.dpfile || riderService?.dpfile,
    availability: rider?.availability ,
    coordinates: rider?.coordinates || riderService?.coordinates,
    experience: rider?.experience,
    
    // Service-specific data
    serviceId: riderService?.id,
    serviceName: riderService?.name,
    serviceEmail: riderService?.email,
    serviceDpfile: riderService?.dpfile,
    serviceCoordinates: riderService?.coordinates,
    // Fallback to rider data if service data is not available
    
    
    // Flags
    hasRiderData: !!rider,
    hasServiceData: !!riderService,
  };
};

// Custom hook for managing vendor isochrones
export function useVendorIsochrones(vendorId: string | undefined, selectedRiderId: string | null, location: number[] | null) {
  const [currentLocation, setCurrentLocation] = useState(location);

  // Query to get all isochrones for the vendor (grouped by riders)
  const {
    data: vendorData,
    loading: vendorLoading,
    error: vendorError,
    refetch: refetchVendorData,
  } = useQuery(GET_ISOCHRONES_BY_VENDOR, {
    variables: { vendorId },
    skip: !vendorId,
    onError: (error) => {
      console.error("Error fetching vendor isochrones:", error);
      toast.error("Failed to load rider data", {
        description: error.message || "Please try refreshing the page",
        duration: 5000,
      });
    },
  });

  // Query for closest isochrone when location changes
  const {
    data: closestIsochroneData,
    loading: closestIsochroneLoading,
    error: closestIsochroneError,
    refetch: refetchClosestIsochrone,
    
  } = useQuery(GET_CLOSEST_ISOCHRONE, {
    variables: {
      riderId: selectedRiderId,
      location: currentLocation,
    },
    skip: !selectedRiderId || !currentLocation || !Array.isArray(currentLocation) || currentLocation.length < 2,
    onCompleted: (data) => {
      if (data?.getClosestIsochroneForLocation) {
        handleIsochroneResult(data.getClosestIsochroneForLocation);
      }
    },
    onError: (error) => {
      console.error("Error fetching closest isochrone:", error);
    },
  });

  // Handler function for isochrone results
  const handleIsochroneResult = useCallback((isochrone: IsochroneData) => {
    if (!isochrone) return;
    
    const addressName = isochrone.address || "appropriate";
    
    toast.success("Location found in delivery zone", {
      description: `Using ${addressName} delivery zone`,
      duration: 3000,
    });
  }, []);

  // Function to update the location and trigger a refetch
  const updateLocation = useCallback((newLocation: number[]) => {
    if (!Array.isArray(newLocation) || newLocation.length < 2) {
      console.error("Invalid location format:", newLocation);
      return;
    }
    
    setCurrentLocation(newLocation);
    
    // If we have a selected rider, refetch with the new location
    if (selectedRiderId) {
      refetchClosestIsochrone({
        riderId: selectedRiderId,
        location: newLocation
      });
    }
  }, [selectedRiderId, refetchClosestIsochrone]);

  // Function to select a rider
  const selectRider = useCallback((riderId: string) => {
    console.log(`Selecting rider: ${riderId}`);
    
    // If we have a current location, fetch the closest isochrone for this rider
    if (currentLocation) {
      refetchClosestIsochrone({
        riderId,
        location: currentLocation
      });
    }
  }, [currentLocation, refetchClosestIsochrone]);

  // Process vendor data to get riders and their map data
  const vendorMapData: VendorMapData[] = vendorData?.getAllIsochronesByVendor || [];
  
  // Get map data for the selected rider
  const selectedRiderMapData: IsochroneData[] = (() => {
    if (!selectedRiderId || !vendorMapData.length) return [];
    
    const riderData = vendorMapData.find((data) => {
      const combinedRider = combineRiderData(data.riders.rider, data.riders.riderService);
      return combinedRider.id === selectedRiderId;
    });
    
    return riderData ? riderData.riders.mapData : [];
  })();

  // Get all riders with their basic info and pricing extracted from isochrone metadata
  const allRiders: (CombinedRiderInfo & { 
    minPrice: number; 
    maxPrice: number; 
    minDistance: number; 
    maxDistance: number;
    totalZones: number;
  })[] = vendorMapData.map((data) => {
    const combinedRider = combineRiderData(data.riders.rider, data.riders.riderService);
    const mapData = data.riders.mapData;
    
    console.log('Processing combined rider:', combinedRider.name, 'with mapData:', mapData);
    console.log('Rider data source:', { 
      hasRiderData: combinedRider.hasRiderData, 
      hasServiceData: combinedRider.hasServiceData 
    });
    
    // Extract pricing and distance info from isochrone metadata
    let minPrice = Infinity;
    let maxPrice = 0;
    let minDistance = Infinity;
    let maxDistance = 0;
    let totalZones = 0;
    
    mapData.forEach((isochrone, isoIndex) => {
      console.log(`Isochrone ${isoIndex} metadata:`, isochrone.metaData);
      
      if (isochrone.metaData && isochrone.metaData.length > 0) {
        isochrone.metaData.forEach((meta, metaIndex) => {
          console.log(`Meta ${metaIndex}:`, meta);
          
          // Extract price from metadata
          if (meta.price !== undefined && meta.price !== null) {
            minPrice = Math.min(minPrice, meta.price);
            maxPrice = Math.max(maxPrice, meta.price);
            console.log('Updated prices:', { minPrice, maxPrice });
          }
          
          // Extract distance from metadata (should be in km)
          if (meta.distance !== undefined && meta.distance !== null && meta.distance > 0) {
            minDistance = Math.min(minDistance, meta.distance);
            maxDistance = Math.max(maxDistance, meta.distance);
            console.log('Updated distances:', { minDistance, maxDistance });
          }
        });
        totalZones += isochrone.metaData.length;
      } else {
        console.log('No metadata found for isochrone:', isochrone.id);
      }
    });
    
    const processedRider = {
      ...combinedRider,
      minPrice: minPrice === Infinity ? 0 : minPrice,
      maxPrice: maxPrice === 0 ? (minPrice === Infinity ? 0 : minPrice) : maxPrice,
      minDistance: minDistance === Infinity ? 0 : minDistance,
      maxDistance: maxDistance === 0 ? (minDistance === Infinity ? 0 : minDistance) : maxDistance,
      totalZones,
    };
    
    console.log('Final processed combined rider:', processedRider);
    return processedRider;
  });

  return {
    // Vendor data
    vendorMapData,
    allRiders,
    
    // Selected rider data
    selectedRiderMapData,
    closestIsochrone: closestIsochroneData?.getClosestIsochroneForLocation,
    
    // Loading states
    isLoading: vendorLoading || closestIsochroneLoading,
    
    // Error states
    error: vendorError
      ? vendorError.message
      : closestIsochroneError
      ? closestIsochroneError.message
      : null,
    
    // Actions
    selectRider,
    updateLocation,
    refetchVendorData,
    
    // Current state
    currentLocation,
  };
}
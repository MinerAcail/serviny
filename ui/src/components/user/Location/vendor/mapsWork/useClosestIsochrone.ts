import { useState, useCallback } from "react";
import { gql, useQuery } from "@apollo/client";
import { toast } from "sonner";

// Define the GraphQL query for getting all isochrones by rider
export const GET_ISOCHRONES_BY_RIDER = gql`
  query GetAllIsochronesByRider($riderId: String!) {
    getAllIsochronesByRider(riderId: $riderId) {
      id
      geojson
      range
      transportMode
      address
      locations
    }
  }
`;

// Define the GraphQL query for closest isochrone
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
    }
  }
`;

// Custom hook for finding the closest isochrone
// Now accepts both riderId and location as parameters
export function useClosestIsochrone(riderId, location) {
  const [selectedIsochroneIndex, setSelectedIsochroneIndex] = useState(0);
  const [currentLocation, setCurrentLocation] = useState(location);

  // Query to get all isochrones (to populate the dropdown)
  const {
    data: allIsochronesData,
    loading: allIsochronesLoading,
    error: allIsochronesError,
    refetch: refetchAllIsochrones,
  } = useQuery(GET_ISOCHRONES_BY_RIDER, {
    variables: { riderId },
    skip: !riderId,
  });

  // Query to get the closest isochrone automatically when location changes
  const {
    data: closestIsochroneData,
    loading: closestIsochroneLoading,
    error: closestIsochroneError,
    refetch: refetchClosestIsochrone,
  } = useQuery(GET_CLOSEST_ISOCHRONE, {
    variables: {
      riderId,
      location: currentLocation,
    },
    skip: !riderId || !currentLocation || !Array.isArray(currentLocation) || currentLocation.length < 2,
    onCompleted: (data) => {
      if (data?.getClosestIsochroneForLocation) {
        handleIsochroneResult(data.getClosestIsochroneForLocation);
      }
    },
    onError: (error) => {
      console.error("Error fetching closest isochrone:", error);
    //   toast.error("Could not find isochrone for this location", {
    //     description: error.message || "Please try a different location",
    //     duration: 5000,
    //   });
    },
  });

  // Handler function for isochrone results
  const handleIsochroneResult = useCallback((isochrone) => {
    if (!isochrone) return;
    
    // Find the index of this isochrone in the all isochrones array
    const allIsochrones = allIsochronesData?.getAllIsochronesByRider || [];
    const foundIndex = allIsochrones.findIndex(
      (iso) => iso.id === isochrone.id
    );

    const addressName = isochrone.address || "appropriate";
    
    // Update the selected isochrone index
    if (foundIndex >= 0) {
      setSelectedIsochroneIndex(foundIndex);
      
      toast.success("Location found in delivery zone", {
        description: `Using ${addressName} delivery zone`,
        duration: 3000,
      });
    } else {
      console.warn(
        "API returned an isochrone that's not in our local array:",
        isochrone.id
      );
      
      // Use index 0 if not found
      setSelectedIsochroneIndex(0);
      
      toast.success("Location found in delivery zone", {
        description: "Using optimal delivery zone",
        duration: 3000,
      });
    }
  }, [allIsochronesData]);

  // Function to update the location and trigger a refetch
  const updateLocation = useCallback((newLocation) => {
    if (!Array.isArray(newLocation) || newLocation.length < 2) {
      console.error("Invalid location format:", newLocation);
      return;
    }
    
    setCurrentLocation(newLocation);
    
    // If we have valid data, refetch with the new location
    if (riderId) {
      refetchClosestIsochrone({
        riderId,
        location: newLocation
      });
    }
  }, [riderId, refetchClosestIsochrone]);

  // Still provide a direct API access function for flexibility
  const findClosestIsochrone = useCallback(
    (coordinates) => {
      if (!riderId) return Promise.reject("No rider ID provided");

      // Update the current location and trigger automatic query
      updateLocation(coordinates);
      
      // Return a promise that resolves when the query completes
      return new Promise((resolve, reject) => {
        refetchClosestIsochrone({
          riderId,
          location: coordinates,
        })
          .then(({ data }) => {
            if (data?.getClosestIsochroneForLocation) {
              const isochrone = data.getClosestIsochroneForLocation;
              const allIsochrones = allIsochronesData?.getAllIsochronesByRider || [];
              const foundIndex = allIsochrones.findIndex(
                (iso) => iso.id === isochrone.id
              );
              
              // Return the result
              resolve({
                isochrone,
                isochroneIndex: foundIndex >= 0 ? foundIndex : 0,
                isInAnyZone: true,
              });
            } else {
              reject(new Error("No isochrone found"));
            }
          })
          .catch(reject);
      });
    },
    [riderId, updateLocation, refetchClosestIsochrone, allIsochronesData]
  );

  return {
    riderIsochrones: allIsochronesData?.getAllIsochronesByRider || [],
    closestIsochrone: closestIsochroneData?.getClosestIsochroneForLocation,
    isLoading: allIsochronesLoading || closestIsochroneLoading,
    error: allIsochronesError
      ? allIsochronesError.message
      : closestIsochroneError
      ? closestIsochroneError.message
      : null,
    selectedIsochroneIndex,
    setSelectedIsochroneIndex,
    findClosestIsochrone,  // Keep this for compatibility
    updateLocation,        // New function to update location
    currentLocation,       // Expose current location state
    refetchIsochrones: refetchAllIsochrones,
  };
}
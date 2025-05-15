import axios from 'axios';

// Define types
interface IsochroneRequestParams {
  location: [number, number]; // [longitude, latitude]
  ranges: number[]; // in seconds
}

// Use environment variables 
const ORS_API_KEY = import.meta.env.VITE_OPENROUTE_SERVICE_API_KEY;

/**
 * Service to fetch isochrones directly from the OpenRouteService API
 */
export const fetchIsochrones = async ({ location, ranges }: IsochroneRequestParams) => {
  try {
    // Validate inputs
    if (!location || !Array.isArray(location) || location.length !== 2) {
      throw new Error("Invalid location. Expected [longitude, latitude]");
    }

    if (!ranges || !Array.isArray(ranges)) {
      throw new Error("Invalid ranges. Expected array of time values in seconds");
    }

    if (!ORS_API_KEY) {
      throw new Error("OpenRouteService API key is not configured");
    }

    // Call OpenRouteService API directly from the client
    const response = await axios.post(
      "https://api.openrouteservice.org/v2/isochrones/driving-car",
      {
        locations: [location], // [longitude, latitude]
        range: ranges, // in seconds
        attributes: ["area", "reachfactor", "total_pop"],
        area_units: "km",
        range_type: "time",
        smoothing: 1,
      },
      {
        headers: {
          Authorization: ORS_API_KEY,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error generating isochrones:", error);
    
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`OpenRouteService API error: ${error.response.status}`);
    }
    
    throw new Error("Failed to generate isochrones");
  }
}
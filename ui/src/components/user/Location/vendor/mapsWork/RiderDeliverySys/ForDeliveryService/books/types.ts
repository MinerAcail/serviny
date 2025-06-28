// types.ts - Type definitions, constants, and utility functions

import { gql } from "@apollo/client";

// ============== TYPES ==============

export interface Zone {
  id: string;
  min: number;
  max: number;
  price: number;
  color: string;
  backendId?: string;
  isLocal?: boolean;
}

export interface Location {
  coordinates: [number, number];
  address: string;
  placeId: string;
}

export interface RiderRange {
  id: string;
  riderId: string;
  startKm: number;
  endKm: number;
  price: number;
  updatedAt?: string;
}

export interface SearchLocationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationSelect: (location: Location) => void;
  isLoaded: boolean;
  currentLocation: Location | null;
}

// ============== CONSTANTS ==============

export const SPEED_MAPPING = {
  walking: 5,
  cycling: 15,
  driving: 40,
} as const;

// ============== GRAPHQL OPERATIONS ==============

export const GET_RIDER_RANGES = gql`
  query getRiderRanges {
    getRiderRanges {
      id
      riderId
      startKm
      endKm
      price
      updatedAt
    }
  }
`;

export const CREATE_RIDER_RANGE = gql`
  mutation createRiderRange($input: NewRiderRangeInput!) {
    createRiderRange(input: $input) {
      id
      riderId
      startKm
      endKm
      price
    }
  }
`;

export const UPDATE_RIDER_RANGE = gql`
  mutation updateRiderRange($input: UpdateRiderRangeInput!) {
    updateRiderRange(input: $input) {
      id
      riderId
      startKm
      endKm
      price
    }
  }
`;

export const DELETE_RIDER_RANGE = gql`
  mutation deleteRiderRange($id: String!) {
    deleteRiderRange(id: $id)
  }
`;

// ============== UTILITY FUNCTIONS ==============

export const convertZoneToRiderRangeInput = (
  zone: Zone,
  zoneMethod: "distance" | "time",
  transportMode: "walking" | "cycling" | "driving"
) => {
  let startKm = zone.min;
  let endKm = zone.max;

  // Convert time-based zones to distance for backend storage
  if (zoneMethod === "time") {
    const speed = SPEED_MAPPING[transportMode];
    startKm = (zone.min * speed) / 60; // Convert minutes to hours, then to km
    endKm = (zone.max * speed) / 60;
  }

  return {
    startKm: Number(startKm.toFixed(2)),
    endKm: Number(endKm.toFixed(2)),
    price: Number(zone.price.toFixed(2)),
  };
};

export const convertRiderRangeToZone = (
  riderRange: RiderRange,
  zoneMethod: "distance" | "time",
  transportMode: "walking" | "cycling" | "driving",
  colorIndex: number,
  ZONE_COLORS: string[]
): Zone => {
  let min = riderRange.startKm;
  let max = riderRange.endKm;

  // Convert distance back to time for display if needed
  if (zoneMethod === "time") {
    const speed = SPEED_MAPPING[transportMode];
    min = (riderRange.startKm * 60) / speed; // Convert km to minutes
    max = (riderRange.endKm * 60) / speed;
  }

  return {
    id: `zone_${riderRange.id}`,
    min: Number(min.toFixed(1)),
    max: Number(max.toFixed(1)),
    price: riderRange.price,
    color: ZONE_COLORS[colorIndex % ZONE_COLORS.length],
    backendId: riderRange.id,
    isLocal: false,
  };
};
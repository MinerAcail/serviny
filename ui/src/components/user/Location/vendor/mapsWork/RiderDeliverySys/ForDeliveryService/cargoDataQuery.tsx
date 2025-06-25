// ==========================================
// Simplified Cargo Data Query and Hook
// ==========================================

import { useState, useEffect } from 'react';
import { gql, useQuery } from '@apollo/client';
import { useSearchParams } from 'react-router';

// GraphQL Query for Cargo Data (Simplified)
const GET_CARGO_BY_BOOKING = gql`
  query GetCargoByBooking($bookingId: String!) {
    getCargoByBookingID(bookingId: $bookingId) {
      id
      transportType
      bookingId
      multiGroupId
      createdAt
      updatedAt
    }
  }
`;

// GraphQL Query for Multiple Cargo Data (Multi-Group)
const GET_CARGO_BY_MULTI_GROUP = gql`
  query GetCargoByMultiGroup($multiGroupId: String!) {
    getCargoByMultiGroupId(multiGroupId: $multiGroupId) {
      id
      transportType
      bookingId
      multiGroupId
      createdAt
      updatedAt
    }
  }
`;

// TypeScript Interfaces (Simplified)
export interface CargoData {
  id: string;
  transportType: string;
  bookingId?: string;
  multiGroupId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UseCargoDataResult {
  cargoData: CargoData[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  // Computed properties we actually need
  primaryTransportType: string | null;
  allTransportTypes: string[];
  hasMultipleVehicleTypes: boolean;
  totalCargoCount: number;
}

// Custom Hook for Cargo Data
export const useCargoData = (bookingId?: string): UseCargoDataResult => {
  const [searchParams] = useSearchParams();
  const isCargo = searchParams.get('cargo') === 'true';
  const isMultiLocation = searchParams.get('isMultiLocation') === 'true';
  
  // State for computed values
  const [computedData, setComputedData] = useState({
    primaryTransportType: null as string | null,
    allTransportTypes: [] as string[],
    hasMultipleVehicleTypes: false,
    totalCargoCount: 0,
  });

  // Single booking cargo query
  const { 
    data: singleCargoData, 
    loading: singleLoading, 
    error: singleError,
    refetch: refetchSingle 
  } = useQuery(GET_CARGO_BY_BOOKING, {
    variables: { bookingId: bookingId || '' },
    skip: !bookingId || !isCargo || isMultiLocation,
    errorPolicy: 'all'
  });

  // Multi-booking cargo query  
  const { 
    data: multiCargoData, 
    loading: multiLoading, 
    error: multiError,
    refetch: refetchMulti 
  } = useQuery(GET_CARGO_BY_MULTI_GROUP, {
    variables: { multiGroupId: bookingId || '' },
    skip: !bookingId || !isCargo || !isMultiLocation,
    errorPolicy: 'all'
  });

  // Determine which data to use
  const cargoData = isMultiLocation 
    ? multiCargoData?.getCargoByMultiGroupId || null
    : singleCargoData?.getCargoByBookingID ? [singleCargoData.getCargoByBookingID] : null;

  const isLoading = isMultiLocation ? multiLoading : singleLoading;
  const error = isMultiLocation ? multiError : singleError;

  // Compute derived data whenever cargo data changes
  useEffect(() => {
    if (!cargoData || cargoData.length === 0) {
      setComputedData({
        primaryTransportType: null,
        allTransportTypes: [],
        hasMultipleVehicleTypes: false,
        totalCargoCount: 0,
      });
      return;
    }

    // Get all transport types
    const transportTypes = cargoData
      .map(cargo => cargo.transportType)
      .filter(Boolean);

    // Get unique transport types
    const uniqueTransportTypes = [...new Set(transportTypes)];

    // Primary transport type (most common or first)
    const primaryType = uniqueTransportTypes[0] || null;

    // Check if multiple vehicle types
    const hasMultiple = uniqueTransportTypes.length > 1;

    setComputedData({
      primaryTransportType: primaryType,
      allTransportTypes: uniqueTransportTypes,
      hasMultipleVehicleTypes: hasMultiple,
      totalCargoCount: cargoData.length,
    });
  }, [cargoData]);

  const refetch = () => {
    if (isMultiLocation) {
      refetchMulti();
    } else {
      refetchSingle();
    }
  };

  return {
    cargoData,
    isLoading: isLoading && isCargo, // Only show loading for cargo deliveries
    error: error?.message || null,
    refetch,
    ...computedData,
  };
};

// Helper function to get cargo type label
export const getCargoTypeLabel = (type: string): string => {
  const cargoTypes: Record<string, string> = {
    'mini-truck': 'Mini Truck',
    'van': 'Van',
    'pickup': 'Pickup Truck',
    'container-truck': 'Container Truck',
    'flatbed': 'Flatbed Truck',
    'refrigerated': 'Refrigerated Truck'
  };
  return cargoTypes[type] || type;
};

// Hook for URL-based cargo parameters (fallback)
export const useCargoParams = () => {
  const [searchParams] = useSearchParams();
  
  return {
    isCargo: searchParams.get('cargo') === 'true',
    cargoType: searchParams.get('cargoType') || '',
    splitCargo: searchParams.get('splitCargo') === 'true',
    isMultiLocation: searchParams.get('isMultiLocation') === 'true',
  };
};
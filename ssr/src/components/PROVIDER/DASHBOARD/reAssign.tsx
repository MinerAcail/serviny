import React, { useState, useMemo } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';
import { 
  AlertCircle, 
  UserCheck, 
  Loader2, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  User,
  Search,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
//   DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';

// Types
interface Rider {
  id: string;
  name: string;
  number: string;
  email?: string;
  state: string;
  dpfile?: string;
}

interface RiderRequest {
  id: string;
  riderId: string;
  termsConditions: boolean;
  message?: string;
  serviceId: string;
  state: string;
  createdAt: string;
  updatedAt: string;
}

interface RiderWithRequest {
  rider: Rider;
  request: RiderRequest;
}




interface ReAssignRiderResponse {
  reAssignRider: Rider;
}

// GraphQL Response Types
interface GetAllRidersResponseInforData {
  getAllRidersResponseInfor: RiderWithRequest[];
}

interface ReAssignRiderDialogProps {
  entityId: string;
  entityType: string;
  currentRiderName?: string | null;
  currentRiderId?: string | null;
}

// GraphQL Queries
const ALL_RIDERS_QUERY = gql`
  query GetAllRidersResponseInfor {
    getAllRidersResponseInfor {
      rider {
        id
        name
        number
        email
        state
        dpfile
      }
      request {
        id
        riderId
        termsConditions
        message
        serviceId
        state
        createdAt
        updatedAt
      }
    }
  }
`;

const REASSIGN_RIDER_MUTATION = gql`
  mutation ReAssignRider($entityId: String!, $entityType: String!, $riderId: String!) {
    reAssignRider(entityId: $entityId, entityType: $entityType, riderId: $riderId) {
      id
      name
      number
      email
      dpfile
    }
  }
`;

const ReAssignRiderDialog: React.FC<ReAssignRiderDialogProps> = ({ 
  entityId, 
  entityType, 
  currentRiderName = null,
  // currentRiderId = null
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedRiderId, setSelectedRiderId] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch all riders
  const { data: ridersData, loading: ridersLoading, error: ridersError } = useQuery<GetAllRidersResponseInforData>(
    ALL_RIDERS_QUERY
    // Removed the skip option and uncommented the query
  );
  
  console.log("ridersData", ridersData);
  
  const [reassignRider, { loading: mutationLoading, error: mutationError, data: mutationData }] = useMutation<ReAssignRiderResponse>(
    REASSIGN_RIDER_MUTATION,
    {
      onCompleted: () => {
        setShowConfirmation(false);
        // Keep dialog open to show success message for 3 seconds, then close
        setTimeout(() => {
          setIsOpen(false);
          setSelectedRiderId('');
        }, 3000);
      },
      onError: (error) => {
        console.error('Reassign rider error:', error);
      }
    }
  );

  // Show all riders without any filtering - extract riders from the request info
  const availableRiders: Rider[] = ridersData?.getAllRidersResponseInfor?.map(item => item.rider) || [];
  const riderRequestMap = new Map<string, RiderRequest>(
    ridersData?.getAllRidersResponseInfor?.map(item => [item.rider.id, item.request]) || []
  );

  // Filter riders based on search query
  const filteredRiders = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableRiders;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return availableRiders.filter(rider => 
      (rider.name && rider.name.toLowerCase().includes(query)) ||
      (rider.number && rider.number.toLowerCase().includes(query)) ||
      (rider.email && rider.email.toLowerCase().includes(query)) ||
      (rider.state && rider.state.toLowerCase().includes(query))
    );
  }, [availableRiders, searchQuery]);

  const selectedRider = filteredRiders.find(rider => rider.id === selectedRiderId);
  const selectedRiderRequest = selectedRiderId ? riderRequestMap.get(selectedRiderId) : null;

  const handleReassign = async (): Promise<void> => {
    if (!entityId || !entityType || !selectedRiderId) {
      return;
    }

    // Check if rider is approved
    if (selectedRiderRequest?.state !== 'approved') {
      alert(`Cannot assign rider. Rider must be approved first. Current status: ${selectedRiderRequest?.state || 'unknown'}`);
      return;
    }

    try {
      await reassignRider({
        variables: {
          entityId,
          entityType,
          riderId: selectedRiderId
        }
      });
    } catch (err) {
      console.error('Error reassigning rider:', err);
    }
  };

  const handleOpenChange = (open: boolean): void => {
    if (!mutationLoading) {
      setIsOpen(open);
      if (!open) {
        setShowConfirmation(false);
        setSelectedRiderId('');
        setSearchQuery('');
      }
    }
  };

  const handleConfirm = (): void => {
    if (selectedRiderId) {
      // Check if rider is approved before showing confirmation
      if (selectedRiderRequest?.state !== 'approved') {
        alert(`Cannot assign rider. Rider must be approved first. Current status: ${selectedRiderRequest?.state || 'unknown'}`);
        return;
      }
      setShowConfirmation(true);
    }
  };

  const handleCancelConfirmation = (): void => {
    setShowConfirmation(false);
  };

  const resetDialog = (): void => {
    setShowConfirmation(false);
    setSelectedRiderId('');
    setSearchQuery('');
  };

  const handleRiderSelect = (riderId: string): void => {
    setSelectedRiderId(riderId);
  };

  const clearSearch = (): void => {
    setSearchQuery('');
  };

  // Handle image error with proper typing
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>): void => {
    const target = e.currentTarget;
    const nextElement = target.nextElementSibling as HTMLElement | null;
    
    target.style.display = 'none';
    if (nextElement) {
      nextElement.style.display = 'flex';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          disabled={!entityId || !entityType}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reassign Rider
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-lg w-full max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg">Reassign {entityType?.toLowerCase()} Rider</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Success State */}
          {mutationData && !mutationError && (
            <div className="text-center space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Rider Successfully Reassigned!
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  New Rider: {mutationData.reAssignRider?.name || 'Assigned'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {entityType} ID: {entityId.slice(-6)}
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {(mutationError || ridersError) && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {mutationError?.message || ridersError?.message || 'An error occurred'}
                </AlertDescription>
              </Alert>
              <div className="flex justify-center">
                <Button onClick={resetDialog} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Loading State */}
          {mutationLoading && (
            <div className="text-center space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Reassigning Rider...
                </h3>
                <p className="text-sm text-gray-600">
                  Please wait while we assign {selectedRider?.name} to this {entityType?.toLowerCase()}
                </p>
              </div>
            </div>
          )}

          {/* Confirmation State */}
          {showConfirmation && !mutationLoading && !mutationData && !mutationError && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Are you sure you want to assign {selectedRider?.name} to this {entityType}?
                </AlertDescription>
              </Alert>
              
              <div className="bg-gray-50 rounded-md p-4 space-y-2">
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Type:</span> {entityType}</p>
                  <p><span className="font-medium">ID:</span> {entityId}</p>
                  {currentRiderName && (
                    <p><span className="font-medium">Current Rider:</span> {currentRiderName}</p>
                  )}
                  <p><span className="font-medium">New Rider:</span> {selectedRider?.name} ({selectedRider?.number})</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button 
                  onClick={handleReassign}
                  className="flex-1"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Confirm Reassign
                </Button>
                <Button 
                  onClick={handleCancelConfirmation}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
              </div>
            </div>
          )}

          {/* Rider Selection State */}
          {!showConfirmation && !mutationLoading && !mutationData && !mutationError && (
            <div className="space-y-4">
              {/* Order Details in Accordion */}
              <Accordion type="single" collapsible defaultValue="order-details">
                <AccordionItem value="order-details" className="border rounded-lg">
                  <AccordionTrigger className="px-4 py-3 text-left hover:no-underline">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-sm">{entityType} Details</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">Type:</span>
                        <span className="text-gray-900">{entityType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-600">ID:</span>
                        <span className="text-gray-900 font-mono text-xs break-all">{entityId}</span>
                      </div>
                      {currentRiderName && (
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-600">Current Rider:</span>
                          <span className="text-gray-900">{currentRiderName}</span>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Riders Loading */}
              {ridersLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span className="text-sm text-gray-600">Loading riders...</span>
                </div>
              )}

              {/* Riders List */}
              {!ridersLoading && availableRiders.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 text-sm">Select New Rider</h4>
                    <span className="text-xs text-gray-500">
                      {filteredRiders.length} rider{filteredRiders.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search riders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-10 text-sm"
                    />
                    {searchQuery && (
                      <button
                        onClick={clearSearch}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Riders Grid - Mobile Optimized */}
                  <div className="max-h-64 overflow-y-auto space-y-2">
                    {filteredRiders.length > 0 ? (
                      filteredRiders.map((rider) => (
                        <div
                          key={rider.id}
                          onClick={() => handleRiderSelect(rider.id)}
                          className={`
                            p-3 rounded-lg border cursor-pointer transition-all
                            ${selectedRiderId === rider.id 
                              ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:bg-gray-100'
                            }
                          `}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {rider.dpfile ? (
                                <img 
                                  src={rider.dpfile} 
                                  alt={rider.name}
                                  className="h-10 w-10 rounded-full object-cover border"
                                  onError={handleImageError}
                                />
                              ) : null}
                              <div 
                                className={`h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center ${rider.dpfile ? 'hidden' : 'flex'}`}
                              >
                                <User className="h-5 w-5 text-gray-400" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {rider.name}
                                </p>
                                {selectedRiderId === rider.id && (
                                  <CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0 ml-2" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 truncate">
                                {rider.number}
                              </p>
                              <div className="flex items-center justify-between mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  rider.state === 'ACTIVE' 
                                    ? 'bg-green-100 text-green-800' 
                                    : rider.state === 'INACTIVE'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {rider.state}
                                </span>
                                {/* Show approval status */}
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ml-2 ${
                                  riderRequestMap.get(rider.id)?.state === 'approved'
                                    ? 'bg-blue-100 text-blue-800'
                                    : riderRequestMap.get(rider.id)?.state === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : riderRequestMap.get(rider.id)?.state === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {riderRequestMap.get(rider.id)?.state || 'unknown'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">No riders found</p>
                        <p className="text-xs text-gray-500">Try adjusting your search</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* No Riders Available */}
              {!ridersLoading && availableRiders.length === 0 && (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-sm text-gray-600">No riders available</p>
                </div>
              )}

              {/* Action Button */}
              <Button 
                onClick={handleConfirm}
                className="w-full py-3"
                disabled={!selectedRiderId || ridersLoading}
                size="lg"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {selectedRiderId 
                  ? selectedRiderRequest?.state === 'approved'
                    ? `Assign ${selectedRider?.name}`
                    : `${selectedRider?.name} (${selectedRiderRequest?.state || 'unknown'} - Need Approval)`
                  : 'Select a Rider'
                }
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReAssignRiderDialog;
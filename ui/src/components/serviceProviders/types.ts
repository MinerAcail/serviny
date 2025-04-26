// types.ts

// Provider interface
export interface Provider {
    id: number;
    name: string;
    specialty: string;
  }
  
  // Location interface
  export interface Location {
    id: number;
    name: string;
    address: string;
  }
  
  // TimeSlot interface
  export interface TimeSlot {
    day: Date;
    time: string;
  }
  
  // User data interface
  export interface UserData {
    name: string;
    email: string;
    phone: string;
    notes: string;
  }
  
  // Booking interface
  export interface Booking {
    id: number;
    provider: Provider;
    location: Location;
    slot: TimeSlot;
    user: UserData;
  }
  
  // Props for the BookingSystem component
  export interface BookingSystemProps {
    // Any custom props can be added here
    initialStep?: number;
    customTimeSlots?: string[];
    customProviders?: Provider[];
    customLocations?: Location[];
    onBookingComplete?: (booking: Booking) => void;
  }
  
  // Props for BookingGrid subcomponent if needed
  export interface BookingGridProps {
    startDate: Date;
    timeSlots: string[];
    bookedSlots: TimeSlot[];
    onSlotClick: (day: Date, time: string) => void;
  }
  
  // Props for the main component container styles
  export interface MainTypes {
    MaincontainerStyles?: React.CSSProperties;
  }
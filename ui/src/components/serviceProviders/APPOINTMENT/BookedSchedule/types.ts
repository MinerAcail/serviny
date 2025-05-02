export interface UserData {
  id: string;
  name: string;
  numberType: string;
  type: string;
  number: string;
}

export interface BookingDetails {
  id: string;
  startTime: string;
  endTime: string;
  day: string;
  notes?: string;
  userId: string;
  tableSize: number;
  userType: string;
}

export interface AppointmentBooking {
  book: BookingDetails;
  usersData: UserData[];
}

export interface QueryResponse {
  getAllAppointmentBookings: AppointmentBooking[];
}

import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
// import { Card, CardContent } from './ui/card';
// import { Spinner } from '@/components/ui/spinner';
import { format } from 'date-fns';
import { LoaderCircle } from 'lucide-react';

// Define the GraphQL query
const GET_BOOKED_DATA = gql`
  query getBookedData {
    getBookedData {
      event {
        id
        name
        recurring
        startTime
        date
        duration
      }
      usersData {
        id
        name
        numberType
        type
      }
    }
  }
`;

// TypeScript interfaces
interface UserData {
  id: string;
  name: string;
  numberType: string;
  type: string;
}

interface Event {
  id: string;
  name: string;
  recurring: string | null;
  startTime: string;
  date: string;
  duration: number;
}

interface BookedData {
  event: Event;
  usersData: UserData[];
}

interface BookedDataResponse {
  getBookedData: BookedData[];
}

function EventBookedMembers() {
  const { loading, error, data } = useQuery<BookedDataResponse>(GET_BOOKED_DATA);

  if (loading) return (
    <Card className="bg-white/95 shadow-md rounded-2xl p-6 mt-4">
      <CardContent className="flex justify-center items-center h-32">
        <LoaderCircle />
      </CardContent>
    </Card>
  );

  if (error) return (
    <Card className="bg-white/95 shadow-md rounded-2xl p-6 mt-4">
      <CardContent className="text-center text-destructive">
        Error loading bookings data
      </CardContent>
    </Card>
  );

  const bookedData = data?.getBookedData || [];

  // Group events by date
  const eventsByDate = bookedData.reduce((acc, item) => {
    const date = new Date(item.event.date);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    
    acc[dateStr].push(item);
    return acc;
  }, {} as Record<string, BookedData[]>);

  return (
    <Card className="">
      <CardContent>
        <h2 className="text-lg font-semibold mb-4">Upcoming Bookings</h2>
        
        {Object.keys(eventsByDate).length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No bookings found
          </div>
        ) : (
          Object.entries(eventsByDate)
            .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
            .map(([dateStr, items]) => (
              <div key={dateStr} className="mb-6">
                <h3 className="font-medium  mb-2 text-primary">
                  {format(new Date(dateStr), 'EEEE, MMMM d, yyyy')}
                </h3>
                
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.event.id} className="border rounded-lg p-3 bg-muted/30">
                      <div className="flex justify-between mb-2">
                        <div className="font-medium">{item.event.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.event.startTime} ({item.event.duration} min)
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">Attendees ({item.usersData.length}):</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {item.usersData.map((user) => (
                            <div key={user.id} className="flex items-center p-2 bg-background rounded">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                                {user.name.charAt(0)}
                              </div>
                              <div className="ml-2">
                                <div className="text-sm font-medium">{user.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {user.type} • {user.numberType || 'N/A'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
        )}
      </CardContent>
    </Card>
  );
}

export default EventBookedMembers;
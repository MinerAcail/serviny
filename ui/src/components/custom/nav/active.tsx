import { gql, useQuery } from "@apollo/client";
import { Badge } from "@/components/ui/badge"; // Assuming you're using shadcn/ui

const GET_USER_ACTIVITY = gql`
  query GetUserActivity {
    GetUserActivity {
      userID
      isActive
      lastActive
    }
  }
`;

const UserActivityBadge = () => {
  const { data, loading, error } = useQuery(GET_USER_ACTIVITY, {
    pollInterval: 5000, // Check every 5 seconds
  });

  if (loading) return <Badge variant="outline">Checking...</Badge>;
  if (error) return <Badge variant="destructive">Error</Badge>;

  const isActive = data?.GetUserActivity?.isActive;

  return (
    <Badge variant="outline" className={isActive ? "bg-green-500 text-white" : "bg-red-500 text-white"}>
      {isActive ? "Active" : "Offline"}
    </Badge>
  );
};

export default UserActivityBadge;

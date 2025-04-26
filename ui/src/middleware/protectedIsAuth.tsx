import { useAuth } from "@/middleware/context/authContext";
import { Navigate } from "react-router";

interface ProtectedRouteProps {
  element: JSX.Element;
  expectedTypes: string[];
}

function ProtectedIsAuthRoute({ element, expectedTypes }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  console.log("User Type:", user?.type); // Debugging output

  const hasExpectedTypes = isAuthenticated && expectedTypes.includes(user?.type ?? "");

  if (!isAuthenticated || !hasExpectedTypes) {
    return <Navigate to="/job" replace />;
  }

  return element;
}

export default ProtectedIsAuthRoute;

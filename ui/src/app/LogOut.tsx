import { ReactNode } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/middleware/context/authContext";
import { gql, useMutation } from "@apollo/client";
export const LOGOUT = gql`
  mutation logOut {
    logOut
  }
`;
const Logout = ({ children }: { children: ReactNode }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [logOut] = useMutation(LOGOUT, {
    onError: (error) => {
      console.error("Logout error:", error);
    },
    variables: {
      serviceId: user?.id,
    },
  });

  const handleLogout = () => {
    logOut(); // Call the logout mutation
    logout(); // Clear user session
    navigate("/"); // Redirect to login
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Logout</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to logout?
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline">Cancel</Button>
            <Button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Logout
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Logout;

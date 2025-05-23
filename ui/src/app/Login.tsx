import { ReactNode, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useMutation, gql } from "@apollo/client";
import { useAuth } from "@/middleware/context/authContext";
import { Eye, EyeOff } from "lucide-react";
import { ProtectType } from "@/middleware/useProtect";

export const LOGIN = gql`
  mutation serviceLogin($input: LoginInput!) {
    serviceLogin(input: $input) {
      __typename
      ... on Service {
        id
        name
        number
        type
      }
      ... on User {
        id
        name
        number
        type
      }

      ... on Rider {
        id
        name
        number
        type
      }
    }
  }
`;

const Login = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const { login: Auth } = useAuth();

  const [number, setNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [serviceLogin, { loading }] = useMutation(LOGIN, {
    onError: (error) => {
      setError(error.message || "Login failed. Please try again.");
    },
  });

  const handleLogin = async () => {
    try {
      setError("");
      if (!number || !password) {
        setError("Please fill in all fields");
        return;
      }

      const result = await serviceLogin({
        variables: {
          input: {
            number,
            password,
          },
        },
      });
      console.log("result", result);

      // Check if login was successful
      if (result?.data?.serviceLogin) {
        // Authenticate the user
        Auth(result.data.serviceLogin);

        // You can check the type to navigate to different routes if needed
        const userType = result.data.serviceLogin.type;
        console.log(userType);

        if (userType === ProtectType.Service) {
          navigate(`/providers/${result.data.serviceLogin.id}`);
        } else {
          setError("Invalid user type. Please contact support.");
        }
      } else {
        setError("Login failed. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      navigate("/login");
      console.error("Login error:", err);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Login</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="grid gap-4 py-4"
        >
          <div className="grid gap-2">
            <Input
              id="number"
              placeholder="Phone Number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
          </div>
          <div className="grid gap-2 relative">
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex ">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
            <Link to={"/reset"}>
              <Button variant={"link"} type="button" className="w-full">
                Forget Password
              </Button>
            </Link>

            {/* //create a account btn */}

            <Link to={"/provider/new"}>
              <Button variant={"link"} type="button" className="w-full">
                Create
              </Button>
            </Link>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default Login;

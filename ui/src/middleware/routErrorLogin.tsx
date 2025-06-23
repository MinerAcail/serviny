import { Link, useNavigate, useParams } from "react-router";
import { AlertCircle, User, Truck, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useAuth, useProfileUpdate } from "./context/authContext";
import React, { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { LOGIN } from "@/app/Login";
import { ProtectType } from "./useProtect";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserAuthCard from "@/components/custom/users/create";

export default function ErrorLogin() {
  const navigate = useNavigate();
  const { login: Auth } = useAuth();
  const { serviceId } = useParams<{ serviceId: string }>(); // Get ServiceId from URL

  const { triggerUpdate } = useProfileUpdate(null);

  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile screen size on component mount and window resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkScreenSize();

    // Add event listener for window resize
    window.addEventListener("resize", checkScreenSize);

    // Cleanup event listener on component unmount
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const [formData, setFormData] = useState({
    number: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [serviceLogin, { loading }] = useMutation(LOGIN, {
    onError: (error) => {
      setError(error.message || "Login failed. Please try again.");
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleLogin = async () => {
    try {
      setError("");
      if (!formData.number || !formData.password) {
        setError("Please fill in all fields");
        return;
      }

      const result = await serviceLogin({
        variables: {
          input: {
            number: formData.number,
            password: formData.password,
          },
        },
      });

      if (result?.data?.serviceLogin) {
        // Authenticate the user
        Auth(result.data.serviceLogin);

        // Get user type
        const userType = result.data.serviceLogin.type;

        // Navigate based on userType
        if (userType === ProtectType.Service) {
          triggerUpdate(result.data.serviceLogin.id);
        } else if (userType === ProtectType.User) {
          triggerUpdate(serviceId ?? "");
        } else if (userType === ProtectType.Rider) {
          triggerUpdate(result.data.serviceLogin.id);
        }
      } else {
        setError("Login failed. Please try again.");
      }
      navigate(`/`);
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Login error:", err);
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Login form component for reuse
  const LoginForm = () => (
    <form onKeyDown={handleKeyDown} className="space-y-4">
      <div className="space-y-2">
        <Input
          id="number"
          placeholder="Phone Number"
          value={formData.number}
          onChange={handleInputChange}
          className="w-full"
        />
      </div>
      <div className="space-y-2 relative">
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            className="w-full"
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
      {error && (
        <div className="text-sm text-red-500 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </form>
  );

  // Register options component for reuse
  const RegisterOptions = () => (
    <Tabs defaultValue="user" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-4">
        <TabsTrigger value="user">User </TabsTrigger>
        <TabsTrigger value="service">Service</TabsTrigger>
        <TabsTrigger value="rider">Rider</TabsTrigger>
      </TabsList>
      <TabsContent value="user" className="space-y-4">
        <div className="flex items-center justify-center h-24 bg-gray-100 rounded-md">
          <User className="h-12 w-12 text-gray-400" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="font-medium">Create User Account</h3>
          <p className="text-sm text-gray-500">
            Sign up as a regular user to access services
          </p>
        </div>
        <UserAuthCard>
          <Button variant="outline" className="w-full">
            Create User Account
          </Button>
        </UserAuthCard>
      </TabsContent>
      <TabsContent value="service" className="space-y-4">
        <div className="flex items-center justify-center h-24 bg-gray-100 rounded-md">
          <Truck className="h-12 w-12 text-gray-400" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="font-medium">Register as Service Provider</h3>
          <p className="text-sm text-gray-500">
            Offer your services and manage your business
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate("/provider/new")}
        >
          Create Service Account
        </Button>
      </TabsContent>
       <TabsContent value="rider" className="space-y-4">
        <div className="flex items-center justify-center h-24 bg-gray-100 rounded-md">
          <Truck className="h-12 w-12 text-gray-400" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="font-medium">Register as Rider</h3>
            <p className="text-sm text-gray-500">
            Riders work under a service provider to deliver services.
            </p>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate("/rider/new")}
        >
          Create Rider Account
        </Button>
      </TabsContent>
    </Tabs>
  );

  // Mobile view with tabs for Login/Register sections
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col w-full items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Account Access</CardTitle>
              <CardDescription>Log in or create a new account</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="space-y-4">
                  <LoginForm />
                  <Button
                    onClick={handleLogin}
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                  <div className="text-sm text-center text-gray-500">
                    <span>Forgot your password? </span>
                    <Link to="/reset" className="text-blue-600 hover:underline">
                      Reset it here
                    </Link>
                  </div>
                </TabsContent>

                <TabsContent value="register" className="space-y-4">
                  <RegisterOptions />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <Link to="/" className="text-blue-600 hover:underline">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Desktop view with side-by-side cards
  return (
    <div className="min-h-screen flex flex-col w-full items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Login Card */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Login to your account</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
            <CardFooter className="flex flex-col space-y-3">
              <Button
                onClick={handleLogin}
                className="w-full"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
              <div className="text-sm text-center text-gray-500">
                <span>Forgot your password? </span>
                <Link
                  to="/reset-password"
                  className="text-blue-600 hover:underline"
                >
                  Reset it here
                </Link>
              </div>
            </CardFooter>
          </Card>

          {/* Create Account Card */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Create a new account</CardTitle>
              <CardDescription>
                Sign up for a new account in just a few steps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegisterOptions />
            </CardContent>
            <CardFooter className="text-sm text-center text-gray-500">
              <div>
                <span>Already have an account? </span>
                <button
                  className="text-blue-600 hover:underline"
                  onClick={() => window.scrollTo(0, 0)}
                >
                  Login instead
                </button>
              </div>
            </CardFooter>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="text-blue-600 hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

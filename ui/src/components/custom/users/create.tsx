"use client";

import React, { useState, useRef } from "react";
import { Phone, User, Lock } from "lucide-react";
import { toast } from "sonner";
import { gql, useMutation } from "@apollo/client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/middleware/context/authContext";

// Define GraphQL mutations
const SERVICE_LOGIN = gql`
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
    }
  }
`;

const CREATE_USER = gql`
  mutation createUser($input: inputUser!) {
    createUser(input: $input) {
      id
      name
      number
      type
      numberType
    }
  }
`;

// Types for phone types
enum PhoneType {
  WHATSAPP = "WHATSAPP",
  PHONE = "PHONE",
  BOTH = "BOTH",
}

export default function UserAuthCard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  const switchToLoginTab = () => {
    if (tabsRef.current) {
      const loginTrigger = tabsRef.current.querySelector(
        '[value="login"]'
      ) as HTMLButtonElement;
      if (loginTrigger) {
        loginTrigger.click();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Welcome</CardTitle>
            <CardDescription className="text-center">
              Login or create a new account to continue
            </CardDescription>
          </CardHeader>
          <Tabs defaultValue="login" className="w-full" ref={tabsRef}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="create">Create Account</TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login">
              <LogInUser setOpen={setOpen} />
            </TabsContent>

            {/* Create Account Form */}
            <TabsContent value="create">
              <CreateUser switchToLoginTab={switchToLoginTab} />
            </TabsContent>
          </Tabs>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

// Create function for the user login
function LogInUser({ setOpen }: { setOpen: (open: boolean) => void }) {
  const { login: Auth } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  // Set up mutation
  const [serviceLogin, { loading }] = useMutation(SERVICE_LOGIN, {
    onCompleted: (data) => {
      console.log("Login successful:", data);
      toast.success("Login successful!");
      // Handle successful login (store user data, redirect, etc.)
      // Close the dialog
      setOpen(false);
    },
    onError: (error) => {
      toast.error(`Login failed: ${error.message}`);
    },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await serviceLogin({
      variables: {
        input: {
          number: phoneNumber,
          password: password,
        },
      },
    });

    if (result?.data?.serviceLogin) {
      Auth(result.data.serviceLogin);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="phone-login">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone-login"
              type="tel"
              placeholder="Enter your phone number"
              className="pl-10"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password-login">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password-login"
              type="password"
              placeholder="Enter your password"
              className="pl-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Logging in..." : "Login"}
        </Button>
      </CardFooter>
    </form>
  );
}

function CreateUser({ switchToLoginTab }: { switchToLoginTab: () => void }) {
  const [name, setName] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [phoneType, setPhoneType] = useState<PhoneType>(PhoneType.BOTH);
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");

  // Set up mutation
  const [createUser, { loading }] = useMutation(CREATE_USER, {
    onCompleted: (data) => {
      console.log("Account created:", data);
      toast.success("Account created successfully!", {
        description:
          "Please kindly use the information to log in and continue.",
      });

      // Move the user to the login tab
      switchToLoginTab();

      // Clear input fields after successful account creation
      setName("");
      setPhoneNumber("");
      setPhoneType(PhoneType.BOTH);
      setPassword("");
      setConfirmPassword("");
    },
    onError: (error) => {
      console.error("Create account error:", error);
      toast.error("Account creation failed", {
        description:
          "A user with the same name or phone number already exists.",
      });
    },
  });

  const validatePasswords = () => {
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePasswords()) return;

    await createUser({
      variables: {
        input: {
          name,
          number: phoneNumber,
          numberType: phoneType, // No need for toUpperCase() as it's already an enum
          password,
        },
      },
    });
  };

  return (
    <form
      onSubmit={handleCreateAccount}
      className="sm:max-w-lg max-h-80 overflow-y-auto"
    >
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              className="pl-10"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone-create">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone-create"
              type="tel"
              placeholder="Enter your phone number"
              className="pl-10"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Phone Type</Label>
          <RadioGroup
            value={phoneType}
            onValueChange={(value) => setPhoneType(value as PhoneType)}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={PhoneType.WHATSAPP} id="whatsapp-create" />
              <Label htmlFor="whatsapp-create">WhatsApp only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={PhoneType.PHONE} id="phone-create" />
              <Label htmlFor="phone-create">Phone only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={PhoneType.BOTH} id="both-create" />
              <Label htmlFor="both-create">Both</Label>
            </div>
          </RadioGroup>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password-create">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password-create"
              type="password"
              placeholder="Create a password"
              className="pl-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm your password"
              className="pl-10"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {passwordError && (
            <p className="text-sm text-red-500">{passwordError}</p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating Account..." : "Create Account"}
        </Button>
      </CardFooter>
    </form>
  );
}

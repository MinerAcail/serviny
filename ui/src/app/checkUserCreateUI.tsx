import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  BadgeCheck,
  Truck,
  User,
  ArrowRight,
  UserRoundPlus,
  Building2,
} from "lucide-react";
import React, { ReactNode } from "react";
import { useNavigate } from "react-router";

// Import the UserAuthCard component
// This is your existing authentication component from @/components/custom/users/create
import UserAuthCard from "@/components/custom/users/create";

interface RegisterOptionProps {
  value: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  link?: string;
  benefits: string[];
  isUser?: boolean;
  onCloseDialog?: (closed: boolean) => void;
}

export const RegisterOption: React.FC<RegisterOptionProps> = ({
  value,
  icon,
  title,
  description,
  buttonText,
  link,
  benefits,
  isUser = false,
  onCloseDialog,
}) => {
  const navigate = useNavigate();

  // This function handles the click for service provider option
  const handleServiceClick = () => {
    if (link) {
      navigate(link);
    }
    if (onCloseDialog) {
      onCloseDialog(true);
    }
  };

  return (
    <TabsContent value={value} className="mt-6 outline-none">
      <Card className="border-2 shadow-sm hover:shadow-md transition-all duration-200">
        <CardHeader className="pb-2">
          <div className="flex justify-center mb-2">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              {icon}
            </div>
          </div>
          <CardTitle className="text-xl text-center">{title}</CardTitle>
          <CardDescription className="text-center">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2">
                <BadgeCheck className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">{benefit}</span>
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter>
          {isUser ? (
            // For user option, use the UserAuthCard as a wrapper
            <UserAuthCard>
              <Button className="w-full group">
                <span>{buttonText}</span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </UserAuthCard>
          ) : (
            // For service provider option, use the normal button
            <Button className="w-full group" onClick={handleServiceClick}>
              <span>{buttonText}</span>
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </TabsContent>
  );
};
// ()
export const RegisterGetSartBtn = ({ children }: { children: ReactNode }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            Choose Registration Type
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="user" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="user"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <User className="h-4 w-4 mr-2" />
              User
            </TabsTrigger>
            <TabsTrigger
              value="service"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Service Provider
            </TabsTrigger>
          </TabsList>
          <RegisterOption
            value="user"
            icon={<User className="h-8 w-8" />}
            title="User Account"
            description="Access services as a regular user"
            buttonText="Create User Account"
            isUser={true}
            benefits={[
              "Book services from verified providers",
              "Manage appointments in one place",
              "Save favorites and preferences",
              "Access exclusive offers and discounts",
            ]}
          />
          <RegisterOption
            value="service"
            icon={<Truck className="h-8 w-8" />}
            title="Service Provider Account"
            description="Offer your services to customers"
            buttonText="Create Provider Account"
            link="/provider/new"
            benefits={[
              "List your services to our growing user base",
              "Manage bookings and schedule efficiently",
              "Receive payments securely through our platform",
              "Build your reputation with verified reviews",
            ]}
            // onCloseDialog={}
          />
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
const RegisterOptionsForFormsTypes = ({
  isCollapsed,
}: {
  isCollapsed?: boolean;
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="font-medium">
          <UserRoundPlus />
          {!isCollapsed && <span>Register</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            Choose Registration Type
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="user" className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="user"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <User className="h-4 w-4 mr-2" />
              User
            </TabsTrigger>
            <TabsTrigger
              value="service"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Service Provider
            </TabsTrigger>
            <TabsTrigger
              value="rider"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Truck className="h-4 w-4 mr-2" />
              Rider
            </TabsTrigger>
          </TabsList>
          <RegisterOption
            value="user"
            icon={<User className="h-8 w-8" />}
            title="User Account"
            description="Access services as a regular user"
            buttonText="Create User Account"
            isUser={true}
            benefits={[
              "Book services from verified providers",
              "Manage appointments in one place",
              "Save favorites and preferences",
              "Access exclusive offers and discounts",
            ]}
            onCloseDialog={() => {
              // Find the dialog element and close it
              const dialog = document.querySelector(
                '[role="dialog"]'
              ) as HTMLElement | null;
              if (dialog) {
                // If using shadcn/ui dialog, trigger close via Escape key event
                dialog.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "Escape" })
                );
              }
            }}
          />

          <RegisterOption
            value="service"
            icon={<Building2 className="h-8 w-8" />}
            title="Service Provider Account"
            description="Offer your services to customers"
            buttonText="Create Provider Account"
            link="/provider/new"
            benefits={[
              "List your services to our growing user base",
              "Manage bookings and schedule efficiently",
              "Receive payments securely through our platform",
              "Build your reputation with verified reviews",
            ]}
            onCloseDialog={() => {
              // Find the dialog element and close it
              const dialog = document.querySelector(
                '[role="dialog"]'
              ) as HTMLElement | null;
              if (dialog) {
                // If using shadcn/ui dialog, trigger close via Escape key event
                dialog.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "Escape" })
                );
              }
            }}
          />
          <RegisterOption
            value="rider"
            icon={<Truck className="h-8 w-8" />}
            title="Rider Account"
            description="Deliver with ease and get access to powerful tools"
            buttonText="Create Rider Account"
            link="/rider/new"
            benefits={[
              "Access to real-time delivery and route optimization tools",
              "Integrated map support for efficient navigation",
              "Easily manage delivery tasks and schedules",
              "Grow your reputation through customer ratings and feedback",
            ]}
            onCloseDialog={() => {
              const dialog = document.querySelector(
                '[role="dialog"]'
              ) as HTMLElement | null;
              if (dialog) {
                dialog.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "Escape" })
                );
              }
            }}
          />
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
const RegisterOptions = ({ isCollapsed }: { isCollapsed?: boolean }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="font-medium">
          <UserRoundPlus />
          {!isCollapsed && <span>Register</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            Choose Registration Type
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="user" className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="user"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <User className="h-4 w-4 mr-2" />
              User
            </TabsTrigger>
            <TabsTrigger
              value="service"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Service Provider
            </TabsTrigger>
            <TabsTrigger
              value="rider"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Truck className="h-4 w-4 mr-2" />
              Rider
            </TabsTrigger>
          </TabsList>
          <RegisterOption
            value="user"
            icon={<User className="h-8 w-8" />}
            title="User Account"
            description="Access services as a regular user"
            buttonText="Create User Account"
            isUser={true}
            benefits={[
              "Book services from verified providers",
              "Manage appointments in one place",
              "Save favorites and preferences",
              "Access exclusive offers and discounts",
            ]}
            onCloseDialog={() => {
              const dialog = document.querySelector(
                '[role="dialog"]'
              ) as HTMLElement | null;
              if (dialog) {
                dialog.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "Escape" })
                );
              }
            }}
          />

          <RegisterOption
            value="service"
            icon={<Building2 className="h-8 w-8" />}
            title="Service Provider Account"
            description="Offer your services to customers"
            buttonText="Create Provider Account"
            link="/provider/new"
            benefits={[
              "List your services to our growing user base",
              "Manage bookings and schedule efficiently",
              "Receive payments securely through our platform",
              "Build your reputation with verified reviews",
            ]}
            onCloseDialog={() => {
              const dialog = document.querySelector(
                '[role="dialog"]'
              ) as HTMLElement | null;
              window.location.reload();

              if (dialog) {
                dialog.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "Escape" })
                );
              }
            }}
          />
          <RegisterOption
            value="rider"
            icon={<Truck className="h-8 w-8" />}
            title="Rider Account"
            description="Deliver with ease and get access to powerful tools"
            buttonText="Create Rider Account"
            link="/rider/new"
            benefits={[
              "Access to real-time delivery and route optimization tools",
              "Integrated map support for efficient navigation",
              "Easily manage delivery tasks and schedules",
              "Grow your reputation through customer ratings and feedback",
            ]}
            onCloseDialog={() => {
              const dialog = document.querySelector('[role="dialog"]') as HTMLElement | null;
              window.location.reload();

              if (dialog) {
                dialog.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "Escape" })
                );
              }
            }}
          />
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterOptions;

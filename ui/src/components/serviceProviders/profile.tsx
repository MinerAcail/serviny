import { useEffect, useRef, useState } from "react";
import { gql, useQuery } from "@apollo/client";
import { useParams } from "react-router";
import {
  CalendarSync,
  Edit,
  HardDriveUpload,
  LayoutDashboard,
  Library,
  Mail,
  MapPin,
  NotepadText,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkGallery } from "./gallery";
import AppointmentBookingSystem from "./APPOINTMENT/book";
import { Link } from "react-router";
import Price from "./pandp/Price";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import Policies from "./pandp/policies";
// import { ThemeSelector } from "@/hooks/theme-selector";
import { EventCalendarDialog } from "./eventBase";
import { GET_BOOK_TYPES } from "@/app/vendors/available";
import { InventoryListDialog } from "@/app/vendors/rentalBasedBooking/bookRentals";
import CheckForBookTYpe from "../custom/checkForBookTYpe";
import UserAuthCard from "../custom/users/create";
import { useAuth } from "@/middleware/context/authContext";
import { useCheckAuthId } from "@/middleware/context/checkID";
import MainNaveBar from "./menuBar";
import { Badge } from "../ui/badge";
import { SpectaclesError, SpectaclesLoading } from "../custom/loading";
// import Socials from "../custom/Socials";
// import SocialDialog from "../custom/Socials/social-dialog";
import SocialMediaManager from "../custom/Socials/forms";

const GET_PROVIDER = gql`
  query getProvider($serviceId: String!) {
    getProvider(ServiceId: $serviceId) {
      id
      dpfile
      name
      number
      email
      profession
      aboutMe
      location
      createdAt
    }
  }
`;

const GET_THEME = gql`
  query GetUseTheme($serviceId: String!) {
    getUseTheme(ServiceId: $serviceId)
  }
`;
export function ServiceProviderProfile() {
  const { serviceId } = useParams<{ serviceId: string }>(); // Get ServiceId from URL
  // console.log(serviceId);
  const { setTheme } = useTheme();

  const {
    data: themeData,
    // loading: themeLoading,
    // error: themeError,
  } = useQuery(GET_THEME, {
    variables: { serviceId },
  });
  useEffect(() => {
    if (themeData?.getUseTheme) {
      setTheme(themeData.getUseTheme); 
    }
  }, [themeData, setTheme]);

  const { data, loading, error } = useQuery(GET_PROVIDER, {
    variables: { serviceId },
  });

  const [isTabsFixed, setIsTabsFixed] = useState(false);
  const [activeTab, setActiveTab] = useState("portfolio");
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabsPlaceholderRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isDialogAbout, setDialogAbout] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (tabsRef.current && tabsPlaceholderRef.current) {
        const tabsPosition =
          tabsPlaceholderRef.current.getBoundingClientRect().top;
        setIsTabsFixed(tabsPosition <= 0);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeTab]);

  // if (loading) return <p>Loading...</p>;
  // if (error) return <p>Error: {error.message}</p>;
  // if () return <p>No provider found.</p>;

  const provider = data?.getProvider;

  return (
    <div className="bg-gradient-to-b from-background to-muted/30 mt-4 w-full flex-col justify-center items-center ">
      <div className="pb-11">
        <MainNaveBar serviceId={serviceId} />
      </div>
      {loading && !data?.getProvider ? (
        <SpectaclesLoading />
      ) : (
        <>
          {error ? (
            <SpectaclesError />
          ) : (
            <div className="flex-col justify-center items-center">
              <ProviderProfile
                isDialogOpen={isDialogOpen}
                provider={provider}
                setDialogOpen={setDialogOpen}
                isDialogAbout={isDialogAbout}
                setDialogAbout={setDialogAbout}
              />
              <div className="col-span-8 ">
                <div ref={tabsPlaceholderRef}></div>

                <div
                  className={`${
                    isTabsFixed
                      ? "fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-sm shadow-md z-50 py-2"
                      : ""
                  }`}
                >
                  <div
                    className={`${isTabsFixed ? "container mx-auto px-4" : ""}`}
                  >
                    <Tabs
                      value={activeTab}
                      onValueChange={setActiveTab}
                      className="w-full"
                      ref={tabsRef}
                    >
                      <TabsList className="grid w-full grid-cols-3 rounded-full bg-muted/50 p-1">
                        <TabsTrigger value="portfolio" className="rounded-full">
                          Portfolio
                        </TabsTrigger>
                        <TabsTrigger value="price" className="rounded-full">
                          Price
                        </TabsTrigger>
                        <TabsTrigger value="policies" className="rounded-full">
                          Policies
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </div>

                <div
                  ref={contentRef}
                  className={`${isTabsFixed ? "mt-16" : "mt-6"}`}
                >
                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                  >
                    <TabsContent value="portfolio">
                      <WorkGallery />
                    </TabsContent>
                    <TabsContent value="price">
                      <Price />
                    </TabsContent>
                    <TabsContent value="policies">
                      <Policies />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

type provider = {
  id: string;
  dpfile: string;
  name: string;
  number: string;
  email: string;
  // profession: string;
  profession: string[];

  aboutMe: string;
  location: string;
  createdAt: string;
};
// Define a BookingType enum that matches the one in BookingTypes component
enum BookType {
  APPOINTMENT = "APPOINTMENT",
  RENTAL = "RENTAL",
  EVENT = "EVENT",
  ON_DEMAND = "ON_DEMAND",
  PACKAGE = "PACKAGE",
  CUSTOM_QUOTE = "CUSTOM_QUOTE",
}
const ProviderProfile = ({
  provider,
  isDialogOpen,
  setDialogOpen,
  isDialogAbout,
  setDialogAbout,
}: {
  provider: provider;
  isDialogOpen: boolean;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isDialogAbout: boolean;
  setDialogAbout: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();

  const { serviceId } = useParams<{ serviceId: string }>(); // Get ServiceId from URL
  // Add bookingType state
  const { data: bookingTypeData } = useQuery(GET_BOOK_TYPES, {
    variables: { serviceId: serviceId }, // Replace with actual serviceId
  });
  const bookingTypes: BookType[] = Array.isArray(
    bookingTypeData?.getBookingType
  )
    ? (bookingTypeData.getBookingType as BookType[])
    : [];

  const { isMatch } = useCheckAuthId(serviceId);

  return (
    <div
      className="relative rounded-lg shadow-md mb-8 overflow-hidden"
      style={{
        backgroundImage: `url(${provider?.dpfile || "/default-profile.png"})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Blur overlay */}
      <div className="absolute inset-0 backdrop-blur-lg bg-primary-foreground/70 "></div>

      {/* Content container with proper padding and spacing */}
      <div className="relative z-10 lg:p-6 pt-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Profile Image */}
          <div className="flex justify-center lg:justify-start">
            <div className="relative h-48 w-48 overflow-hidden rounded-full border-4 border-white shadow-xl">
              <img
                src={provider?.dpfile || "/default-profile.png"}
                alt={`${provider?.name || "Provider"} Profile`}
                className="h-full w-full object-cover rounded-full"
              />
            </div>
          </div>

          {/* Provider Details */}
          <div
            className={`flex-1 flex flex-col  rounded-md p-7 w-full inset-0 backdrop-blur-lg 
          ${
            theme === "blue"
              ? "bg-secondary-foreground/90"
              : "bg-primary-foreground"
          }`}
          >
            <div className="text-center lg:text-left mb-6">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl mb-2 text-white">
                {provider?.name || "Provider Name"}
              </h1>

              <div className="space-y-2">
                {provider?.profession?.map((profession, idx) => (
                  <Badge key={idx} className="text-xs m-4">
                    {profession}
                  </Badge>
                ))}

                <div className="flex justify-between items-center">
                  <ContactInfo provider={provider} />
                  <div className="block ml-2 lg:hidden">
                    <SocialMediaManager serviceId={serviceId ?? ""} />
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="mt-4 flex flex-col items-start justify-start lg:items-start lg:justify-start">
                <div className="flex gap-4">
                  <h2 className="text-xl font-light text-white">About Me</h2>
                  <div className="lg:block hidden">
                    <SocialMediaManager serviceId={serviceId ?? ""} />
                  </div>
                </div>
                <p
                  onClick={() => setDialogAbout(true)}
                  className="mt-3 leading-relaxed text-white/90"
                >
                  {provider?.aboutMe?.length > 100
                    ? `${provider?.aboutMe.substring(0, 100)}...`
                    : provider?.aboutMe}
                </p>
                {provider?.aboutMe?.length > 100 && (
                  <Button
                    variant="link"
                    className="mt-2 text-white"
                    onClick={() => setDialogAbout(true)}
                  >
                    Read More
                  </Button>
                )}
              </div>

              {/* About Me Dialog */}
              {isDialogAbout && (
                <Dialog open={isDialogAbout} onOpenChange={setDialogAbout}>
                  <DialogContent
                    className={`  rounded-md p-7 w-full text-secondary backdrop-blur-lg 
                  ${
                    theme === "blue"
                      ? "bg-secondary-foreground/90"
                      : "bg-primary-foreground"
                  }`}
                  >
                    <DialogHeader>
                      <DialogTitle>About Me</DialogTitle>
                    </DialogHeader>

                    <DialogDescription className="text-muted  text-base max-h-96 overflow-y-auto">
                      {provider?.aboutMe}
                    </DialogDescription>
                    <DialogFooter>
                      <Button
                        variant="default"
                        onClick={() => setDialogAbout(false)}
                      >
                        Close
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-2 flex flex-wrap justify-center lg:justify-start gap-3">
              {isMatch && (
                <>
                  <Link to="/upload">
                    <Button className="gap-2 rounded-full bg-primary hover:bg-primary/90">
                      <HardDriveUpload className="h-4 w-4" />
                      Upload
                    </Button>
                  </Link>
                  <Link to={`/booktypes`}>
                    <Button className="gap-2 rounded-full bg-primary hover:bg-primary/90">
                      <Library className="h-4 w-4" />
                      Business Types
                    </Button>
                  </Link>
                  <Link to="/dashboard">
                    <Button className="gap-2 rounded-full bg-primary hover:bg-primary/90">
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboards
                    </Button>
                  </Link>

                  <Link to="/update">
                    <Button className="gap-2 rounded-full bg-primary hover:bg-primary/90">
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  </Link>

                  <Link to={`/time/${provider.id}`}>
                    <Button className="gap-2 rounded-full bg-primary hover:bg-primary/90">
                      <CalendarSync className="h-4 w-4" />
                      Schedule
                    </Button>
                  </Link>
                </>
              )}

              {/* to={`/providers/${provider.id}`} */}
              {isAuthenticated ? (
                <Button
                  onClick={() => setDialogOpen(true)}
                  variant="secondary"
                  className="gap-2 rounded-full bg-secondary hover:bg-secondary/90"
                >
                  <NotepadText className="h-4 w-4" />
                  Book
                </Button>
              ) : (
                <UserAuthCard>
                  <Button>Book</Button>
                </UserAuthCard>
              )}

              {bookingTypes.length === 0 ? (
                <CheckForBookTYpe
                  isDialogOpenMain={isDialogOpen}
                  setDialogOpenMain={setDialogOpen}
                />
              ) : (
                <>
                  {bookingTypes.includes(BookType.EVENT) && (
                    <EventCalendarDialog
                      isDialogOpenMain={isDialogOpen}
                      setDialogOpenMain={setDialogOpen}
                      // serviceId={serviceId}
                    />
                  )}
                  {bookingTypes.includes(BookType.APPOINTMENT) && (
                    <AppointmentBookingSystem
                      isDialogOpenMain={isDialogOpen}
                      setDialogOpenMain={setDialogOpen}
                      serviceId={serviceId}
                    />
                  )}

                  {bookingTypes.includes(BookType.RENTAL) && (
                    <InventoryListDialog
                      isDialogOpenMain={isDialogOpen}
                      setDialogOpenMain={setDialogOpen}
                      serviceId={serviceId}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import { Check, Copy } from "lucide-react";
// import Link from "next/link"

// import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTheme } from "@/middleware/context/theme-provider";

interface ContactInfoProps {
  provider?: {
    number?: string;
    email?: string;
    location?: string;
  };
  className?: string;
}

export default function ContactInfo({ provider, className }: ContactInfoProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  // Format location for Google Maps URL
  const getGoogleMapsUrl = (location: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      location
    )}`;
  };

  if (!provider) return null;

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex flex-col space-y-3 w-fit text-white md:flex-row md:space-y-0 md:space-x-3",
          className
        )}
      >
        {provider.number && (
          <div className="flex w-fit items-center rounded-md border p-2 transition-colors hover:bg-muted/50">
            <Phone className="mr-2 h-4 w-4  text-white text-muted-foreground" />
            <Link
              to={`tel:${provider.number.replace(/\s+/g, "")}`}
              className="mr-2 text-sm hover:underline"
            >
              {provider.number}
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => copyToClipboard(provider.number!, "number")}
                >
                  {copied === "number" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4  text-white/70" />
                  )}
                  <span className="sr-only">Copy phone number</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{copied === "number" ? "Copied!" : "Copy to clipboard"}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {provider.email && (
          <div className="flex items-center w-fit rounded-md border p-2 transition-colors hover:bg-muted/50">
            <Mail className="mr-2 h-4 w-4  text-white text-muted-foreground" />
            <Link
              to={`mailto:${provider.email}`}
              className="mr-2 text-sm hover:underline"
            >
              {provider.email.slice(0, 16)}
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() => copyToClipboard(provider.email!, "email")}
                >
                  {copied === "email" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4  text-white/70" />
                  )}
                  <span className="sr-only">Copy email address</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{copied === "email" ? "Copied!" : "Copy to clipboard"}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {provider.location && (
          <div className="flex items-center w-fit rounded-md border p-2 transition-colors hover:bg-muted/50">
            <MapPin className="mr-2 h-4 w-4  text-white text-muted-foreground" />
            <Link
              to={getGoogleMapsUrl(provider.location)}
              target="_blank"
              rel="noopener noreferrer"
              className="mr-2 text-sm hover:underline"
            >
              {provider.location}
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={() =>
                    copyToClipboard(provider.location!, "location")
                  }
                >
                  {copied === "location" ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4  text-white/70" />
                  )}
                  <span className="sr-only">Copy address</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{copied === "location" ? "Copied!" : "Copy to clipboard"}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

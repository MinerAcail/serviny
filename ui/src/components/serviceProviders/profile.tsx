import { useEffect, useRef, useState } from "react";
import { gql, useQuery } from "@apollo/client";
import { useParams } from "react-router";
import {
  CalendarSync,
  Edit,
  HardDriveUpload,
  LayoutDashboard,
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
import {

  // ItemNotFound,
  // ItemNotFound,
  // SpectaclesError,
  SpectaclesLoading,
} from "../custom/loading";

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

export function ServiceProviderProfile() {
  const { serviceId } = useParams<{ serviceId: string }>(); // Get ServiceId from URL
  // console.log(serviceId);

  const { data, loading } = useQuery(GET_PROVIDER, {
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



  const provider = data?.getProvider;

  return (
    <div className="bg-gradient-to-b from-background to-muted/30 mt-4 justify-center items-center ">
      <div className="pb-11">
        <MainNaveBar />
      </div>

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
          <div className={`${isTabsFixed ? "container mx-auto px-4" : ""}`}>
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
        {loading && !data && <SpectaclesLoading />}
        {/* {error && <SpectaclesError />} */}
      {/* {!data?.getProvider && <ItemNotFound />} */}

        <div ref={contentRef} className={`${isTabsFixed ? "mt-16" : "mt-6"}`}>
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
    <div className="bg-gradient-to-b from-primary/10 to-primary/5 rounded-lg shadow-md p-6 mb-8">
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
        <div className="flex-1 flex flex-col">
          <div className="text-center lg:text-left mb-6">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl mb-2">
              {provider?.name || "Provider Name"}
            </h1>

            <div className="space-y-2">
              {provider?.profession?.map((profession, idx) => (
                <Badge key={idx} className="text-xs m-4">
                  {profession}
                </Badge>
              ))}

              <div className="flex flex-col md:flex-row md:gap-4 text-muted-foreground">
                {provider?.number && (
                  <p className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {provider?.number}
                  </p>
                )}

                {provider?.email && (
                  <p className="flex items-center gap-1">
                    <span className="h-4 w-4 flex items-center justify-center">
                      @
                    </span>
                    {provider?.email}
                  </p>
                )}

                {provider?.location && (
                  <p className="flex items-center gap-1">
                    <span className="h-4 w-4 flex items-center justify-center">
                      📍
                    </span>
                    {provider?.location}
                  </p>
                )}
              </div>
            </div>

            {/* Rating */}
            <div className="mt-4 flex flex-col items-start justify-start lg:items-start lg:justify-start">
              <h2 className="text-xl font-light">About Me</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {provider?.aboutMe?.length > 100
                  ? `${provider?.aboutMe.substring(0, 100)}...`
                  : provider?.aboutMe}
              </p>
              {provider?.aboutMe?.length > 100 && (
                <Button
                  variant="link"
                  className="mt-2 text-primary"
                  onClick={() => setDialogAbout(true)}
                >
                  Read More
                </Button>
              )}
            </div>

            {/* About Me Dialog */}
            {isDialogAbout && (
              <Dialog open={isDialogAbout} onOpenChange={setDialogAbout}>
                <DialogContent className=" rounded-lg">
                  <DialogHeader>
                    <DialogTitle>About Me</DialogTitle>
                  </DialogHeader>

                  <DialogDescription className="text-muted-foreground max-h-96 overflow-y-auto">
                    {provider?.aboutMe}
                  </DialogDescription>
                  <DialogFooter>
                    <Button
                      variant="outline"
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
  );
};

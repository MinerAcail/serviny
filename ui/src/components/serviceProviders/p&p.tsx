import { useEffect, useRef, useState } from "react";
import { gql, useQuery } from "@apollo/client";
import { useLocation, useParams } from "react-router";
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
// import Policies from "./pandp/policies";
// import { ThemeSelector } from "@/hooks/theme-selector";
import { EventCalendarDialog } from "./eventBase";
import { GET_BOOK_TYPES } from "@/app/vendors/available";
import { InventoryListDialog } from "@/app/vendors/rentalBasedBooking/bookRentals";
import CheckForBookTYpe from "../custom/checkForBookTYpe";
import UserAuthCard from "../custom/users/create";
import { useAuth, useProfileUpdate } from "@/middleware/context/authContext";
import { useCheckAuthId } from "@/middleware/context/checkID";
// import MainNaveBar from "./menuBar";
import { Badge } from "../ui/badge";
import { SpectaclesError, SpectaclesLoading } from "../custom/loading";
// import Socials from "../custom/Socials";
// import SocialDialog from "../custom/Socials/social-dialog";
// import SocialMediaManager from "../custom/Socials/forms";

export const GET_PROVIDER = gql`
  query getProvider($serviceId: String) {
    getProvider(ServiceId: $serviceId) {
      id
      dpfile
      name
      number
      email
      profession
      categories:profession
      aboutMe
      location
      createdAt
      businessType
      coordinates
    }
  }
`;


export default  function ServiceProviderPandP() {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id;
  let { serviceId } = useParams<{ serviceId: string }>();
  const localServiceId = localStorage.getItem("serviceId");
  const { firstProfileId } = useProfileUpdate(userId ? null : serviceId);
  serviceId = firstProfileId ?? serviceId ?? localServiceId ?? "";
  const location = useLocation();

  // Use consistent localStorage key for dialog state
  const [dialogState, setDialogState] = useState(() => {
    const savedState = localStorage.getItem("isDialogOpen");
    return savedState !== null ? JSON.parse(savedState) : true;
  });

  const isLtPresent = new URLSearchParams(location.search).has("lt");
  const isOpPresent = new URLSearchParams(location.search).has("lo");

   const { data, loading, error } = useQuery(GET_PROVIDER, {
    variables: { serviceId: serviceId },
  });
  const [isTabsFixed, setIsTabsFixed] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem(`activep&pTab_${serviceId}`);
    return savedTab || "policies";
  });

  const tabsRef = useRef<HTMLDivElement>(null);
  const tabsPlaceholderRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Remove the separate dialogStateLandingPage state since we're using dialogState

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    localStorage.setItem(`activep&pTab_${serviceId}`, newTab);
  };

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

  useEffect(() => {
    if (serviceId) {
      const savedTab = localStorage.getItem(`activep&pTab_${serviceId}`);
      if (savedTab) {
        setActiveTab(savedTab);
      } else {
        setActiveTab("portfolio");
      }
    }
  }, [serviceId]);

  useEffect(() => {
    if (serviceId) {
      localStorage.setItem("serviceId", serviceId);
    }
  }, [serviceId]);

  useEffect(() => {
    const handleStorageChange = () => {
      const currentState = localStorage.getItem("isDialogOpen");
      if (currentState !== null) {
        setDialogState(JSON.parse(currentState));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);
  // Show the toast only once per session
  useEffect(() => {
    if (!isAuthenticated ) {
      toast.warning("You need to be logged in to save Service profile.");
     
    }
  }, [isAuthenticated]);
  // Show landing page only if user is not authenticated AND no localServiceId is set AND dialog state is true
  if (!isAuthenticated && !localServiceId && dialogState) {
    return <LandingPage onClose={() => setDialogState(false)} />;
  }

  const showLandingPage = (dialogState && !isLtPresent) || isOpPresent;

  if (showLandingPage) {
    return (
      <ServiceLandingPage
        serviceId={serviceId ?? ""}
        businessType={data?.getProvider?.businessType}
        onClose={() => {
          setDialogState(false);
          localStorage.setItem("isServiceDialogOpen", JSON.stringify(false));

          const params = new URLSearchParams(location.search);
          params.delete("lo");

          const newUrl = `${location.pathname}?${params.toString()}`;
          window.location.href = newUrl; // Triggers full page reload
        }}
      />
    );
  }

  return (
    // <div className="flex py-8 w-full">

    <div className="px-4 lg:flex gap-4 py-12 mx-auto ">
      {loading && !data?.getProvider ? (
        <SpectaclesLoading />
      ) : (
        <>
          {error ? (
            <SpectaclesError />
          ) : (
                       <div className="flex-col  pt-14 justify-center items-center">
              
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
                    className={`${
                      isTabsFixed ? "container mx-auto px-4 bg-red-700" : ""
                    }`}
                  >
                  
                    <Tabs
                      value={activeTab}
                      onValueChange={handleTabChange}
                      className="w-full"
                      ref={tabsRef}
                    >
<>
                          <TabsList className="grid w-full grid-cols-2 rounded-full bg-primary/20   p-1">
                           
                            <TabsTrigger
                              value="policies"
                              className="rounded-full"
                            >
                              Policies
                            </TabsTrigger>
                            <TabsTrigger value="price" className="rounded-full">
                              Price
                            </TabsTrigger>
                          </TabsList>
                        </>
                    </Tabs>
                  </div>
                </div>

                <div
                  ref={contentRef}
                  className={`${isTabsFixed ? "mt-16" : "mt-6"}`}
                >
                  <Tabs
                    value={activeTab}
                    onValueChange={handleTabChange}
                    className="w-full "
                  >
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

      {/* <ItemChatWidget
        itemId="product-123"
        itemName="Wireless Headphones"
        itemImage="/placeholder.svg?height=40&width=40"
        sellerName="John Smith"
      /> */}
    </div>
  );
}


export enum BusinessTypeEnum {
  ECOMMERCE_STANDARD = "ecommerce-standard",
  ECOMMERCE_ENTERPRISE = "ecommerce-enterprise",
  PRE_ORDER = "pre-order",
  DROP_SHIPPING = "drop-shipping",
  DELIVERY_STANDARD = "delivery-standard",
  DELIVERY_ENTERPRISE = "delivery-enterprise",
}


import ServiceLandingPage from "../landing/providerLandingPage";

import { AllProducts } from "@/vendor/AllProducts";
import Policies from "./pandp/policies";
import LandingPage from "./page";
import { toast } from "sonner";


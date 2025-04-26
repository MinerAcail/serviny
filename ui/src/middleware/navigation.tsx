import { ApolloProvider } from "@apollo/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import Client from ".";
import HostelStoreApp from "@/app/HostelStoreApp";
import { Toaster } from "@/components/ui/sonner";
import JobPosting from "@/app/works/jobPosting";
import ErrorPage from "./routError";
import { AuthProvider } from "./context/authContext";
import ErrorLogin from "./routErrorLogin";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./bar";
import { SubmitItemForm } from "@/app/userReview/submit-item-form";
import ShopItemsManager from "@/components/custom/sortCategroy/cat/cat.tsx";
import { CartProvider } from "@/hooks/CartContext";
import {
  UpdatEvent,
  ProviderCheckOut,
  VendorDashboard,
  VendorItems,
  VendorProfile,
} from "@/app/vendors";
import ProtectedIsAuthRoute from "./protectedIsAuth";
import { DriverOrderItems, WorkersProfile } from "@/app/driver";
import { OrderTrackingProvider } from "@/hooks/orderTrackingContext";
import { ProtectType } from "./useProtect";
import HeartbeatUpdater from "@/components/custom/nav/cheackActive";
// import DashboardPage from "@/app/Advertiser/dashboard";
import UploadProduct from "@/app/vendors/upload";
import Advertiser from "@/app/Advertiser";
import ServiceProvider from "@/components/serviceProviders";
import { ServiceProvidersDirectory } from "@/components/serviceProviders/allProviders";
import ProfileService from "@/components/serviceProviders/vendorProfile";
import { CreateGalleryForm } from "@/components/serviceProviders/upload/create";
import { CreateServiceProvider } from "@/components/serviceProviders/createProvider";
import BookingTypes from "@/components/serviceProviders/bookingType";
import { ThemeProvider } from "./context/theme-provider";
import { useThemeEffect } from "@/hooks/use-theme-effect";
// import { EventCalendar, EventCalendarDialog } from "@/components/serviceProviders/eventBase";
// import { EventUpdateForm } from "@/components/serviceProviders/eventBase/event-update-form";
import LucideIconSelector from "@/app/vendors/icons";
// import AvailabilityPage from "@/app/vendors/available";
// import SocialMediaHelmet from "@/components/custom/vendors/share";
// import { HelmetProvider } from "react-helmet-async";

const router = createBrowserRouter([
  // { path: "/", element: <HostelStoreApp /> },
  { path: "/:vendorId", element: <HostelStoreApp /> }, // Handle route with optional vendorId
  { path: "/delivery", element: <DriverOrderItems /> },
  { path: "/request", element: <SubmitItemForm /> },
  { path: "/shop", element: <ShopItemsManager /> },
  // { path: "/vendor/:Vendorid", element: <SocialMediaHelmet /> },
  { path: "/job", element: <JobPosting /> },
  { path: "/icons", element: <LucideIconSelector /> },

  // { path: "/", element: <Advertiser /> },
  // { path: "/book", element: <BookingSystem /> },
  { path: "/provider/new", element: <CreateServiceProvider /> },

  { path: "/providers/:serviceId", element: <ServiceProvider /> },
  { path: "/event/:eventId", element: <UpdatEvent /> },

  { path: "/", element: <ServiceProvidersDirectory /> },
  { path: "/upload", element: <CreateGalleryForm /> },
  { path: "/time/:serviceId", element: <ProviderCheckOut /> },
  { path: "/booktypes", element: <BookingTypes /> },
  // { path: "/event", element: <EventCalendarDialog /> },

  {
    path: "/providerprofile",
    element: (
      <ProtectedIsAuthRoute
        expectedTypes={[ProtectType.Service]}
        element={<ProfileService />}
      />
    ),
  },
  {
    path: "/advert",
    element: (
      <ProtectedIsAuthRoute
        expectedTypes={[ProtectType.Advertiser]}
        element={<Advertiser />}
      />
    ),
  },
  {
    path: "/vendor",
    element: (
      <ProtectedIsAuthRoute
        expectedTypes={[ProtectType.vendor]}
        element={<VendorDashboard />}
      />
    ),
  },
  {
    path: "/vendor/new",
    element: (
      <ProtectedIsAuthRoute
        expectedTypes={[ProtectType.vendor]}
        element={<UploadProduct />}
      />
    ),
  },

  {
    path: "/vendoritems",
    element: (
      <ProtectedIsAuthRoute
        expectedTypes={[ProtectType.vendor]}
        element={<VendorItems />}
      />
    ),
  },

  {
    path: "/profile",
    element: (
      <ProtectedIsAuthRoute
        expectedTypes={[ProtectType.vendor]}
        element={<VendorProfile />}
      />
    ),
  },


  {
    path: "/workerprofile",
    element: (
      <ProtectedIsAuthRoute
        expectedTypes={[ProtectType.Driver]}
        element={<WorkersProfile />}
      />
    ),
  },

  { path: "/login", element: <ErrorLogin /> },

  { path: "*", element: <ErrorPage /> },
]);

export function Navigation() {
  useThemeEffect();
  return (
    <ApolloProvider client={Client}>
      <ThemeProvider defaultTheme="system" storageKey="app-theme">
        <SidebarProvider>
          <OrderTrackingProvider>
            <AppSidebar />
            <HeartbeatUpdater />
            <CartProvider>
              <AuthProvider>
                <RouterProvider router={router} />
                <Toaster />
              </AuthProvider>
            </CartProvider>
          </OrderTrackingProvider>
        </SidebarProvider>
      </ThemeProvider>
    </ApolloProvider>
  );
}

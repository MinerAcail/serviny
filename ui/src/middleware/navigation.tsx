import { ApolloProvider } from "@apollo/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import Client from ".";
import { Toaster } from "@/components/ui/sonner";
import ErrorPage from "./routError";
import { AuthProvider } from "./context/authContext";
import ErrorLogin from "./routErrorLogin";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./bar";
import { CartProvider } from "@/hooks/CartContext";
import {
  UpdatEvent,
  ProviderCheckOut,
  VendorDashboard,
  VendorItems,
  VendorProfile,
} from "@/app/vendors";
import ProtectedIsAuthRoute from "./protectedIsAuth";
import { OrderTrackingProvider } from "@/hooks/orderTrackingContext";
import { ProtectType } from "./useProtect";
import HeartbeatUpdater from "@/components/custom/nav/cheackActive";
import UploadProduct from "@/app/vendors/upload";
import Advertiser from "@/app/Advertiser";
import ServiceProvider from "@/components/serviceProviders";
import { ServiceProvidersDirectory } from "@/components/serviceProviders/allProviders";
import ProfileService from "@/components/serviceProviders/updateProfile";
import { CreateGalleryForm } from "@/components/serviceProviders/upload/create";
import { CreateServiceProvider } from "@/components/serviceProviders/createProvider";
import BookingTypes from "@/components/serviceProviders/bookingType";
import { ThemeProvider } from "./context/theme-provider";
import { useThemeEffect } from "@/hooks/use-theme-effect";
import LucideIconSelector from "@/app/vendors/icons";
import Dashboard from "@/components/serviceProviders/Dashboard";
import FavoritesPage from "@/components/serviceProviders/Dashboard/favorites";
// import ContactDetailPage from "@/components/serviceProviders/Dashboard/contacts";
import ContactDetailPage from "@/components/serviceProviders/Dashboard/UserData";
import SearchData from "@/components/serviceProviders/Dashboard/searchInfor";
import LandingPage from "@/components/serviceProviders/page";
import ResetPasswordCard, { PasswordReset } from "@/app/resetPassWord";
// import AvailabilityPage from "@/app/vendors/available";
// import SocialMediaHelmet from "@/components/custom/vendors/share";
// import { HelmetProvider } from "react-helmet-async";

const router = createBrowserRouter([

  { path: "/icons", element: <LucideIconSelector /> },

  { path: "/dashboard", element: <Dashboard /> },
  { path: "/favorites", element: <FavoritesPage /> },
  { path: "/contacts", element: <SearchData /> },
  { path: "/c/:userId", element: <ContactDetailPage /> },
  { path: "/reset", element: <PasswordReset /> },


  { path: "/provider/new", element: <CreateServiceProvider /> },

  { path: "/providers/:serviceId", element: <ServiceProvider /> },
  { path: "/event/:eventId", element: <UpdatEvent /> },

  { path: "/", element: <ServiceProvidersDirectory /> },
  { path: "/upload", element: <CreateGalleryForm /> },
  { path: "/time/:serviceId", element: <ProviderCheckOut /> },
  { path: "/booktypes", element: <BookingTypes /> },

  {
    path: "/update",
    element: (
      <ProtectedIsAuthRoute
        expectedTypes={[ProtectType.Service]}
        element={<ProfileService />}
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

import { ApolloProvider } from "@apollo/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import Client from "..";
import { Toaster } from "@/components/ui/sonner";
import ErrorPage from "./routError";
import { AuthProvider } from "./context/authContext";
import ErrorLogin from "./routErrorLogin";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./bar";
import { CartProvider } from "@/hooks/CartContext";
import { UpdatEvent, ProviderCheckOut } from "@/app/vendors";
import ProtectedIsAuthRoute from "./protectedIsAuth";
import { OrderTrackingProvider } from "@/hooks/orderTrackingContext";
import { ProtectType } from "./useProtect";
import HeartbeatUpdater from "@/components/custom/nav/cheackActive";

import { ServiceProvidersDirectory } from "@/components/serviceProviders/allProviders";
import ProfileService from "@/components/serviceProviders/updateProfile";
import { CreateGalleryForm } from "@/components/serviceProviders/upload/create";
import { CreateServiceProvider } from "@/components/serviceProviders/createProvider";
import BookingTypes from "@/components/serviceProviders/bookingType";
import LucideIconSelector from "@/app/vendors/icons";
import Dashboard from "@/components/serviceProviders/Dashboard";
import FavoritesPage from "@/components/serviceProviders/Dashboard/favorites";
import ContactDetailPage from "@/components/serviceProviders/Dashboard/UserData";
import SearchData from "@/components/serviceProviders/Dashboard/searchInfor";
import { PasswordReset } from "@/app/resetPassWord";
import { ThemeProvider } from "./context/theme-provider";
import {SpectaclesLoading} from "@/components/custom/loading";
import { ServiceProviderProfile } from "@/components/serviceProviders/profile";
import { SocialForm } from "@/components/custom/Socials/forms";
import { InstallPage } from "@/components/custom/downloads/install-page";
// import SocialForm from "@/components/custom/Socials/forms";
// WorksNav
const router = createBrowserRouter([
  { path: "/icons", element: <LucideIconSelector /> },

  { path: "/dashboard", element: <Dashboard /> },
  { path: "/favorites", element: <FavoritesPage /> },
  { path: "/contacts", element: <SearchData /> },
  { path: "/c/:userId", element: <ContactDetailPage /> },
  { path: "/reset", element: <PasswordReset /> },
  { path: "/red", element: <SpectaclesLoading /> },

  { path: "/provider/new", element: <CreateServiceProvider /> },

  { path: "/providers/:serviceId", element: <ServiceProviderProfile /> },
  { path: "/event/:eventId", element: <UpdatEvent /> },

  { path: "/", element: <ServiceProvidersDirectory /> },
  { path: "/upload", element: <CreateGalleryForm /> },
  { path: "/install", element: <InstallPage /> },

  { path: "/social/:serviceId", element: <SocialForm /> },
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
  
  
  return (
    <ApolloProvider client={Client}>
      <ThemeProvider >
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

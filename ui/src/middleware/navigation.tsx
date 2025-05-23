import { ApolloProvider } from "@apollo/client";
import { createBrowserRouter, RouterProvider, useParams } from "react-router";
import Client from "..";
import { Toaster } from "@/components/ui/sonner";
import ErrorPage from "./routError";
import { AuthProvider } from "./context/authContext";
import ErrorLogin from "./routErrorLogin";
// import { SidebarProvider } from "@/components/ui/sidebar";
// import { AppSidebar } from "./bar";
// import { CartProvider } from "@/hooks/CartContext";
import { UpdatEvent } from "@/app/vendors";
import ProtectedIsAuthRoute from "./protectedIsAuth";
import { OrderTrackingProvider } from "@/hooks/orderTrackingContext";
import { ProtectType } from "./useProtect";
// import HeartbeatUpdater from "@/components/custom/nav/cheackActive";

import { ServiceProvidersDirectory } from "@/components/serviceProviders/allProviders";
import ProfileService from "@/components/serviceProviders/updateProfile";
import { CreateGalleryForm } from "@/components/serviceProviders/upload/create";
// import { CreateServiceProvider } from "@/components/serviceProviders/createProvider";
import BookingTypes from "@/components/serviceProviders/bookingType";
import LucideIconSelector from "@/app/vendors/icons";
import Dashboard from "@/components/serviceProviders/Dashboard";
import FavoritesPage from "@/components/serviceProviders/Dashboard/favorites";
import ContactDetailPage from "@/components/serviceProviders/Dashboard/UserData";
import SearchData from "@/components/serviceProviders/Dashboard/searchInfor";
import { PasswordReset } from "@/app/resetPassWord";
import { ThemeProvider } from "./context/theme-provider";
import { SpectaclesLoading } from "@/components/custom/loading";
import { ServiceProviderProfile } from "@/components/serviceProviders/profile";
import { SocialForm } from "@/components/custom/Socials/forms";
import { InstallPage } from "@/components/custom/downloads/install-page";
import { SidebarProvider } from "@/components/ui/sidebar";
const router = createBrowserRouter([
  { path: "/", element: <ServiceProvidersDirectory /> },

  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        path: "/providers/:serviceId",
        element: <ServiceProviderProfile />,
      },
      { path: "/sms", element: <ChatSystem /> },
      { path: "/zonex/:vendorId", element: <DeliveryZoneVisualizerVendor /> },
      { path: "/merge/:serviceId", element: <CheckType /> },

      { path: "/icons", element: <LucideIconSelector /> },
      { path: "/provider/new", element: <ImprovedServiceProvider /> },
      { path: "/rider/new", element: <RiderRegistration /> },

      { path: "/dashboard", element: <Dashboard /> },
      { path: "/favorites", element: <FavoritesPage /> },
      // { path: "/contacts", element: <SearchData /> },
      // { path: "/c/:userId", element: <ContactDetailPage /> },
      { path: "/reset", element: <PasswordReset /> },
      { path: "/red", element: <SpectaclesLoading /> },
      { path: "/type", element: <BusinessType /> },


      { path: "/event/:eventId", element: <UpdatEvent /> },

      { path: "/install", element: <InstallPage /> },

      { path: "/login", element: <ErrorLogin /> },

      { path: "*", element: <ErrorPage /> },
    ],
  },
  // Routes with sidebar layout using Outlet
  {
    path: "/dbp/",
    element: <SidebarLayoutProvider />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "upload", element: <CreateGalleryForm /> },
      { path: "booktypes", element: <BookingTypes /> },
      { path: "time", element: <AvailabilityPage /> },
      { path: "contacts", element: <SearchData /> },
      { path: "social", element: <SocialForm /> },
      { path: "c/:userId", element: <ContactDetailPage /> },
      { path: "zone", element: <VendorProcessFlow /> },
      { path: "zonex", element: <ResultStepData /> },

      {
        path: "update",

        element: (
          <ProtectedIsAuthRoute
            expectedTypes={[ProtectType.Service]}
            element={<ProfileService />}
          />
        ),
      },

      { path: "new", element: <ProductForm /> },
    ],
  },
]);

export function Navigation() {
  return (
    <ApolloProvider client={Client}>
      <ThemeProvider>
        <SidebarProvider>
          <OrderTrackingProvider>
            {/* <AppSidebar /> */}
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

import { Outlet } from "react-router";

import AvailabilityPage from "@/app/vendors/available";
import { Sidebar, SidebarMain } from "@/components/custom/sidebar";
import ProductForm from "@/vendor/ProductForm";
import ChatSystem from "@/components/user/chat-system";
import { VendorProcessFlow } from "@/components/user/Location/vendor";
import { DeliveryZoneVisualizer } from "@/components/user/Location/vendor/mapsWork/visualize";
import { ResultStepData } from "@/components/user/Location/vendor/resultData";
import { CartProvider } from "@/components/custom/cart/cart-context";
import { CartDrawer } from "@/components/custom/cart/cart-drawer";
import BusinessType from "@/components/serviceProviders/createProvider/business-type-selector-app";
import { ImprovedServiceProvider } from "@/components/serviceProviders/createProvider";
import { RiderRegistration } from "@/components/rider/create";
import {  MainDeliveryZoneCreator } from "@/components/user/Location/vendor/mapsWork/RiderDeliverySys/create";
import { DeliveryZoneVisualizerVendor } from "@/components/user/Location/vendor/mapsWork/RiderDeliverySys/deliveryZoneVisualizer";
import CheckType from "@/components/user/Location/vendor/mapsWork/checkType";
// import IsochroneComparison from "@/components/user/Location/vendor/visualize";
// import DeliveryZoneVisualizer from "@/components/user/Location/vendor/visualize";

export function SidebarLayoutProvider() {
  // const { serviceId } = useParams();
  return (
    <div className="flex w-full ">
      <Sidebar />
      <div className="flex-1 p-4">
        <Outlet />
      </div>
    </div>
  );
}

export function Layout() {
  const { serviceId } = useParams();
  // const [isMobileOpen, setIsMobileOpen] = useState(false);
  return (
    <div className="flex w-full bg-cyan-100/20">
      <SidebarMain serviceId={serviceId} />
      <div className="flex-1 p-4">
         <CartDrawer />
        <Outlet />
      </div>
    </div>
  );
}

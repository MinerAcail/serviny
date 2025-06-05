import { ApolloProvider, useLazyQuery } from "@apollo/client";
import { createBrowserRouter, RouterProvider, useParams } from "react-router";
import Client from "..";
import { Toaster } from "@/components/ui/sonner";
import ErrorPage from "./routError";
import { AuthProvider, useAuth } from "./context/authContext";
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
      { path: "/sms", element: <VendorChatSystem /> },
      { path: "/mamp", element: <DeliveryTrackingMap /> },
      { path: "/zonex/:vendorId/:orderId", element: <DeliveryZoneVisualizerVendor /> },
      // { path: "/delivery/:riderId/:bookId", element: <RiderZoneSetup /> },
      // { path: "/delivery/:riderId/:bookId", element: <AutocompleteSearchMap /> },
      { path: "/delivery/:riderId/:bookId", element: <RiderBookingDeliveryRequest /> },


      { path: "/merge/:serviceId", element: <CheckType /> },
      { path: "view/:id", element: <FormPage /> },

      { path: "/icons", element: <LucideIconSelector /> },
      { path: "/provider/new", element: <ImprovedServiceProvider /> },
      { path: "/rider/new", element: <RiderRegistration /> },

      { path: "/dashboard", element: <Dashboard /> },
      { path: "/favorites", element: <FavoritesPage /> },
      { path: "/check", element: <Checkout /> },
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
      { path: "zone", element: <RiderZoneSetup /> },
      { path: "zonex", element: <ResultStepData /> },
      { path: "builder", element: <FormBuilder /> },



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
      { path: "orders", element: <OrderManagementSystem /> },

      ///for service Riders providers
      { path: "livemap", element: <LiveMap /> },
      { path: "live", element: <AllRoutesDisplay /> },

      { path: "analytics", element: <Analytics /> },
      { path: "history", element: <History /> },
      { path: "request", element: <RiderRequests /> },
      { path: "vendors", element: <VendorsByDeliveryService /> },
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
            <AuthProvider>
              {/* <CartProvider> */}
              <RouterProvider router={router} />
              <Toaster />
              {/* </CartProvider> */}
            </AuthProvider>
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
import { MainDeliveryZoneCreator } from "@/components/user/Location/vendor/mapsWork/RiderDeliverySys/create";
import { DeliveryZoneVisualizerVendor } from "@/components/user/Location/vendor/mapsWork/RiderDeliverySys/deliveryZoneVisualizer";
import CheckType from "@/components/user/Location/vendor/mapsWork/checkType";
import { ProviderContextProvider } from "./context/businessType";
import LiveMap from "@/components/serviceProviders/DELIVERY_ENTERPRISE/liveMap/liveMap";
import Analytics from "@/components/serviceProviders/DELIVERY_ENTERPRISE/analytics";
import History from "@/components/serviceProviders/DELIVERY_ENTERPRISE/history";
import RiderRequests from "@/components/serviceProviders/DELIVERY_ENTERPRISE/riderRequests";
import VendorsByDeliveryService from "@/components/serviceProviders/DELIVERY_ENTERPRISE/vendors/vendors";
import { ScrollArea } from "@/components/ui/scroll-area";
import Checkout from "@/components/custom/orders/check";
import SingleRiderTrackingMap from "@/components/rider/getLocation";
import DeliveryTrackingMap from "@/components/rider/getLocation";
import VendorOrder from "@/components/custom/orders";
import AllRoutesDisplay from "@/components/serviceProviders/DELIVERY_ENTERPRISE/liveMap/hooks/getAllRouteData";
import { DeliveryZoneVisualizerDeliveryService, RiderBookingDeliveryRequest } from "@/components/user/Location/vendor/mapsWork/RiderDeliverySys/ForDeliveryService";
import RiderBookingComponent from "@/components/user/Location/vendor/mapsWork/RiderDeliverySys/ForDeliveryService/booking";
import { RiderZoneSetup } from "@/components/user/Location/vendor/mapsWork/RiderDeliverySys/ForDeliveryService/books/riderflow";
import AutocompleteSearchMap from "@/components/user/Location/vendor/mapsWork/RiderDeliverySys/ForDeliveryService/try";
import FormBuilder from "@/components/user/formBuilder/FormBuilder";
import FormsPage from "@/components/user/formBuilder/FormsPage";
import FormPage from "@/components/user/formBuilder/FormPage";
import VendorChatSystem from "@/components/chatsSys/vendor/VendorChatSystem";
import OrderManagementSystem from "@/components/custom/orders/order-management-system";
// import IsochroneComparison from "@/components/user/Location/vendor/visualize";
// import DeliveryZoneVisualizer from "@/components/user/Location/vendor/visualize";

export function SidebarLayoutProvider() {
 const {user}= useAuth()
  const { serviceId } = useParams();
  // const [clearClientCache,{data}] = useLazyQuery(CLEAR_CLIENT_CACHE, {
  //   onCompleted: (data) => {
  //     if (data.clearClientCache) {
  //       // Clear localStorage when server confirms
  //       clearCache();
  //     }
  //   },
  //   onError: (error) => {
  //     console.error("Error clearing client cache:", error);
  //     // Still clear localStorage even if server call fails
  //     clearCache();
  //   }
  // });
// console.log("clearClientCache initialized",data);
  return (
    <div className="flex w-full h-screen overflow-hidden">
      <ProviderContextProvider serviceId={serviceId ?? ""}>
        {/* Sidebar Scrollable */}
        <ScrollArea className="h-full  border-r">
          <Sidebar />
        </ScrollArea>

        {/* Outlet Scrollable */}
        <ScrollArea className="flex-1 p-4">
          <Outlet />
        </ScrollArea>
      </ProviderContextProvider>
    </div>
  );
}

export function Layout() {
  const { serviceId } = useParams();

  return (
    <div className="flex w-full h-screen overflow-hidden bg-cyan-100/20">
      <ProviderContextProvider serviceId={serviceId ?? ""}>
        <CartProvider >

        {/* Sidebar with scroll */}
        <ScrollArea className="h-full border-r">
          <SidebarMain serviceId={serviceId} />
        </ScrollArea>

        {/* Main content with scroll */}
          <ScrollArea className="flex-1 p-4">
            <CartDrawer />
            <Outlet />
          </ScrollArea>
        </CartProvider>
      </ProviderContextProvider>
    </div>
  );
}

import { ApolloProvider } from "@apollo/client";
import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
  useParams,
} from "react-router";

import { Toaster } from "@/components/ui/sonner";
import Client from ".";
import { ViewAllServiceProviders } from "@/components/GLOBAL/ALL_PROVIDERS/viewAllProviders";
import { AuthProvider } from "./context/authContext";
import { useProfileUpdate } from "./hooks/useProfileUpdate";
import { Sidebar, SidebarMain } from "@/components/GLOBAL/SIDEBAR/sidebar";
import { CartProvider } from "@/components/VENDOR/cart/cart-context";
import { ServiceProviderProfile } from "@/components/PROVIDER/HOME";
import { ScrollArea } from "@/components/ui/scroll-area";
import RiderHistory from "@/components/HISTORY";
import { InstallPage } from "@/components/downloads/install-page";
import TutorialsPage from "@/components/GLOBAL/tutorials";
import { SingleBookingDeliveryRequest } from "@/components/USER/APPOINTMENT/singleDeliveryRequest";
import { MultiBookingDeliveryRequest } from "@/components/USER/APPOINTMENT/multiDeliveryRequest";
import UserDeliveryViewer from "@/components/USER/DELIVERY/viewService";
import { FullInvoiceDocument } from "@/components/PROVIDER/HOME/invoice/view";
import { ServiceProviderMergeOrCreateDeliveryZone } from "@/components/VENDOR/MAPWORKS/merge/create";
import { CartDrawer } from "@/components/VENDOR/cart/cart-drawer";
import { DeliveryZoneVisualizerVendor } from "@/components/VENDOR/ORDER/deliveryZoneVisualizer";
import { ProviderContextProvider } from "@/components/GLOBAL/PROTECTION/businessType";
import LiveMap from "@/components/PROVIDER/DASHBOARD/MAPWORKS/liveMap";

const router = createBrowserRouter([
  { path: "/all", element: <ViewAllServiceProviders /> },
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        path: "/",
        element: <ServiceProviderProfile />,
      },
      {
        index: true,
        path: "/providers/:serviceId",
        element: <ServiceProviderProfile />,
      },
      { path: "/history", element: <RiderHistory /> },
      { path: "/install", element: <InstallPage /> },
      { path: "/tutorial", element: <TutorialsPage /> },
      {
        path: "/delivery/:riderId/:bookId",
        element: <SingleBookingDeliveryRequest />,
      },

      {
        path: "/multidelivery/:riderId/:bookId",
        element: <MultiBookingDeliveryRequest />,
      },
      { path: "/vob", element: <UserDeliveryViewer /> }, //view orders bookings
      { path: "/merge", element: <ServiceProviderMergeOrCreateDeliveryZone /> },
      { path: "/invoice/:cargoId", element: <FullInvoiceDocument /> },
      {
        path: "/zonex/:vendorId/:orderId",
        element: <DeliveryZoneVisualizerVendor />,
      },
      {
        path: "/dbp",
        element: <SidebarLayoutProvider />,
        children: [{ index: true, element: <LiveMap /> }],
      },
    ],
  },
]);

export function Layout() {
  // const { serviceId } = useParams();
  const { serviceId: updateServiceId } = useParams<{ serviceId: string }>();
  // const { firstProfileId } = useProfileUpdate(updateServiceId);
  // const serviceId = firstProfileId;
  const { firstProfileId } = useProfileUpdate(null);

  const serviceId = firstProfileId ?? updateServiceId;
  console.log("Service ID in Layout:", serviceId);

  return (
    <div className="flex w-full h-screen overflow-hidden bg-cyan-100/20">
      <CartProvider>
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
    </div>
  );
}
export function SidebarLayoutProvider() {
  return (
    <div className="flex w-full h-screen overflow-hidden">
      {/* <ProviderContextProvider> */}
        {/* Sidebar Scrollable */}
        <ScrollArea className="h-full  border-r">
          {/* <Sidebar /> */}
        </ScrollArea>

        {/* Outlet Scrollable */}
        <ScrollArea className="flex-1 p-4">
          <Outlet />
        </ScrollArea>
      {/* </ProviderContextProvider> */}
    </div>
  );
}
export function Navigation() {
  return (
    <ApolloProvider client={Client}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster />
      </AuthProvider>
    </ApolloProvider>
  );
}

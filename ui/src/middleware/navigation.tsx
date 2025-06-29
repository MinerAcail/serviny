import { ApolloProvider } from "@apollo/client";
import { createBrowserRouter, RouterProvider, useParams } from "react-router";
import React, { Suspense } from "react";
import Client from "..";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useProfileUpdate } from "./context/authContext";
import { OrderTrackingProvider } from "@/hooks/orderTrackingContext";
import { ProtectType } from "./useProtect";
import { ThemeProvider } from "./context/theme-provider";
import { SpectaclesLoading } from "@/components/custom/loading";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Outlet } from "react-router";
import { Sidebar, SidebarMain } from "@/components/custom/sidebar";
import { CartProvider } from "@/components/custom/cart/cart-context";
import { CartDrawer } from "@/components/custom/cart/cart-drawer";
import {
  BusinessTypeEnum,
  ProviderContextProvider,
} from "./context/businessType";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PasswordReset } from "@/app/resetPassWord";
import { ServiceProvidersDirectory } from "@/components/serviceProviders/allProviders";
import { SocialForm } from "@/components/custom/Socials/forms";
// import { MainDeliveryZoneCreator } from "@/components/user/Location/vendor/mapsWork/RiderDeliverySys/create";

// Lazy-loaded components - Pages & Large Components
// const ServiceProvidersDirectory = React.lazy(() => import("@/components/serviceProviders/allProviders"));
const ServiceProviderProfile = React.lazy(
  () => import("@/components/serviceProviders/profile")
);
// const VendorChatSystem = React.lazy(() => import("@/components/chatsSys/vendor/VendorChatSystem"));
// const DeliveryTrackingMap = React.lazy(() => import("@/components/rider/getLocation"));
const TutorialsPage = React.lazy(() => import("@/components/global/tutorials"));
const OrderManagementSystem = React.lazy(
  () => import("@/components/custom/orders/order-management-system")
);
const FormPage = React.lazy(
  () => import("@/components/user/formBuilder/FormPage")
);
const SubmissionsViewer = React.lazy(
  () => import("@/components/user/formBuilder/submissionsViewer")
);
const FormAndRequestTabs = React.lazy(
  () => import("@/components/user/formBuilder/tabbed-forms")
);
const Dashboard = React.lazy(
  () => import("@/components/serviceProviders/Dashboard")
);
const SearchData = React.lazy(
  () => import("@/components/serviceProviders/Dashboard/searchInfor")
);
const FavoritesPage = React.lazy(
  () => import("@/components/serviceProviders/Dashboard/favorites")
);
const ContactDetailPage = React.lazy(
  () => import("@/components/serviceProviders/Dashboard/UserData")
);
const CreateGalleryForm = React.lazy(
  () => import("@/components/serviceProviders/upload/create")
);
const ProfileService = React.lazy(
  () => import("@/components/serviceProviders/updateProfile")
);
const ImprovedServiceProvider = React.lazy(
  () => import("@/components/serviceProviders/createProvider")
);
const BusinessTypeSelector = React.lazy(
  () =>
    import(
      "@/components/serviceProviders/createProvider/business-type-selector"
    )
);

// Delivery Enterprise Components
const LiveMap = React.lazy(
  () =>
    import("@/components/serviceProviders/DELIVERY_ENTERPRISE/liveMap/liveMap")
);
// const Analytics = React.lazy(() => import("@/components/serviceProviders/DELIVERY_ENTERPRISE/analytics"));
const VendorsByDeliveryService = React.lazy(
  () =>
    import("@/components/serviceProviders/DELIVERY_ENTERPRISE/vendors/vendors")
);
const FullInvoiceDocument = React.lazy(
  () =>
    import(
      "@/components/serviceProviders/DELIVERY_ENTERPRISE/liveMap/invoice/view"
    )
);

// Vendor & Cart Components
// const Checkout = React.lazy(() => import("@/components/custom/orders/check"));
const ProductForm = React.lazy(() => import("@/vendor/ProductForm"));
const ServiceHistory = React.lazy(
  () => import("../components/custom/vendors/history")
);

// Rider & Maps Components
const RiderLiveMap = React.lazy(() => import("@/components/rider/LiveMap"));
const RiderHistory = React.lazy(() => import("../components/rider/history"));
const RiderRegistration = React.lazy(() => import("@/components/rider/create"));
const MainDeliveryZoneCreator = React.lazy(
  () =>
    import("@/components/user/Location/vendor/mapsWork/RiderDeliverySys/create")
);
const RiderBookingDeliveryRequest = React.lazy(
  () =>
    import(
      "@/components/user/Location/vendor/mapsWork/RiderDeliverySys/ForDeliveryService"
    )
);
const RiderBookingMultiDeliveryRequest = React.lazy(
  () =>
    import(
      "@/components/user/Location/vendor/mapsWork/RiderDeliverySys/ForDeliveryService/multiBookingLocationsetting/riderBookingMultiDeliveryRequest"
    )
);
const RiderZoneSetup = React.lazy(
  () =>
    import(
      "@/components/user/Location/vendor/mapsWork/RiderDeliverySys/ForDeliveryService/books/riderflow"
    )
);
const DeliveryZoneVisualizerVendor = React.lazy(
  () =>
    import(
      "@/components/user/Location/vendor/mapsWork/RiderDeliverySys/deliveryZoneVisualizer"
    )
);
const ResultStepData = React.lazy(
  () => import("@/components/user/Location/vendor/resultData")
);

// Auth & Business Logic Components
const ErrorPage = React.lazy(() => import("./routError"));
const ErrorLogin = React.lazy(() => import("./routErrorLogin"));
const ProtectedIsAuthRoute = React.lazy(() => import("./protectedIsAuth"));
const ProtectedIsAuthRouteBusinessType = React.lazy(
  () => import("./protectedIsAuthBusinessType")
);
const ProtectedProfileBusinessTypeRoute = React.lazy(
  () => import("./protectedRouteBusinessTypeFromProfile")
);
// const PasswordReset = React.lazy(() => import("@/app/resetPassWord"));
// const UpdatEvent = React.lazy(() => import("@/app/vendors").then(module => ({ default: module.UpdatEvent })));
const AvailabilityPage = React.lazy(() => import("@/app/vendors/available"));

// Other Components
// const SocialForm = React.lazy(() => import("@/components/custom/Socials/forms"));
const InstallPage = React.lazy(
  () => import("@/components/custom/downloads/install-page")
);
const CheckBookingOrderDelivery = React.lazy(
  () => import("@/components/GlobalLogic/checkBookingOrderDelivery")
);

// Loading component wrapper
const LoadingWrapper: React.FC<
  React.PropsWithChildren<{ fallback?: React.ReactNode }>
> = ({ children, fallback = <SpectaclesLoading /> }) => (
  <Suspense fallback={fallback}>{children}</Suspense>
);

const router = createBrowserRouter([
  {
    path: "/all",
    element: <ServiceProvidersDirectory />,
  },

  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        path: "/",
        element: (
          <LoadingWrapper>
            <ServiceProviderProfile />
          </LoadingWrapper>
        ),
      },
      {
        index: true,
        path: "/providers/:serviceId",
        element: (
          <LoadingWrapper>
            <ServiceProviderProfile />
          </LoadingWrapper>
        ),
      },
      // {
      //   path: "/sms",
      //   element: (
      //     <LoadingWrapper>
      //       <VendorChatSystem />
      //     </LoadingWrapper>
      //   )
      // },
      // {
      //   path: "/mamp",
      //   element: (
      //     <LoadingWrapper>
      //       <DeliveryTrackingMap />
      //     </LoadingWrapper>
      //   )
      // },
      {
        path: "/zonex/:vendorId/:orderId",
        element: (
          <LoadingWrapper>
            <DeliveryZoneVisualizerVendor />
          </LoadingWrapper>
        ),
      },
      {
        path: "/tutorial",
        element: (
          <LoadingWrapper>
            <TutorialsPage />
          </LoadingWrapper>
        ),
      },
      {
        path: "/delivery/:riderId/:bookId",
        element: (
          <LoadingWrapper>
            <RiderBookingDeliveryRequest />
          </LoadingWrapper>
        ),
      },
      {
        path: "/multidelivery/:riderId/:bookId",
        element: (
          <LoadingWrapper>
            <RiderBookingMultiDeliveryRequest />
          </LoadingWrapper>
        ),
      },
      {
        path: "merge",
        element: (
          <ProtectedProfileBusinessTypeRoute
          element={
            
            <LoadingWrapper>
              <MainDeliveryZoneCreator />

              </LoadingWrapper>
              }
              expectedBusinessTypes={[
                BusinessTypeEnum?.ECOMMERCE_STANDARD,
                BusinessTypeEnum?.ECOMMERCE_ENTERPRISE,
              ]}
            />
        ),
      },
      {
        path: "view/:id",
        element: (
          <LoadingWrapper>
            <FormPage />
          </LoadingWrapper>
        ),
      },
      {
        path: "views",
        element: (
          <LoadingWrapper>
            <SubmissionsViewer />
          </LoadingWrapper>
        ),
      },

      {
        path: "/provider/new",
        element: (
          <LoadingWrapper>
            <ImprovedServiceProvider />
          </LoadingWrapper>
        ),
      },
      {
        path: "/rider/new",
        element: (
          <LoadingWrapper>
            <RiderRegistration />
          </LoadingWrapper>
        ),
      },
      {
        path: "/vob",
        element: (
          <LoadingWrapper>
            <CheckBookingOrderDelivery />
          </LoadingWrapper>
        ),
      },
      {
        path: "/dashboard",
        element: (
          <ProtectedIsAuthRoute
          expectedTypes={[ProtectType.Service]}
          element={
                <LoadingWrapper>
            
                <Dashboard />
          </LoadingWrapper>
            
            }
            />
        ),
      },

      {
        path: "/reset",
        element: <PasswordReset />,
      },
      // { path: "/red", element: <SpectaclesLoading /> },
      {
        path: "/type",
        element: (
          <LoadingWrapper>
            <BusinessTypeSelector />
          </LoadingWrapper>
        ),
      },
      {
        path: "/history",
        element: (
          <LoadingWrapper>
            <RiderHistory />
          </LoadingWrapper>
        ),
      },

      {
        path: "/install",
        element: (
          <LoadingWrapper>
            <InstallPage />
          </LoadingWrapper>
        ),
      },
      {
        path: "/login",
        element: (
          <LoadingWrapper>
            <ErrorLogin />
          </LoadingWrapper>
        ),
      },
      {
        path: "/invoice/:cargoId",
        element: (
          <LoadingWrapper>
            <FullInvoiceDocument />
          </LoadingWrapper>
        ),
      },
      {
        path: "*",
        element: (
          <LoadingWrapper>
            <ErrorPage />
          </LoadingWrapper>
        ),
      },
      {
        path: "/rider",
        element: (
          <LoadingWrapper>
            <RiderLiveMap />
          </LoadingWrapper>
        ),
      },
    ],
  },
  // Routes with sidebar layout using Outlet
  {
    path: "/dbp/",
    element: (
      <ProtectedIsAuthRoute
      expectedTypes={[ProtectType.Service]}
      element={
            <LoadingWrapper>

          <SidebarLayoutProvider />
      </LoadingWrapper>
        }
        />
    ),
    children: [
      {
        index: true,
        element: (
          <LoadingWrapper>
            <Dashboard />
          </LoadingWrapper>
        ),
      },
      {
        path: "upload",
        element: (
          <LoadingWrapper>
            <CreateGalleryForm />
          </LoadingWrapper>
        ),
      },
      {
        path: "contacts",
        element: (
          <LoadingWrapper>
            <SearchData />
          </LoadingWrapper>
        ),
      },
      {
        path: "favorites",
        element: (
          <LoadingWrapper>
            <FavoritesPage />
          </LoadingWrapper>
        ),
      },
      {
        path: "social",
        element: <SocialForm />,
      },
      {
        path: "c/:userId",
        element: (
          <LoadingWrapper>
            <ContactDetailPage />
          </LoadingWrapper>
        ),
      },
      {
        path: "zonex",
        element: (
          <LoadingWrapper>
            <ResultStepData />
          </LoadingWrapper>
        ),
      },
      {
        path: "update",
        element: (
          <ProtectedIsAuthRoute
          expectedTypes={[ProtectType.Service]}
          element={
                <LoadingWrapper>
              
              <ProfileService />
            
              </LoadingWrapper>
            }
            />
        ),
      },
      {
        path: "new",
        element: (
          <LoadingWrapper>
            <ProductForm />
          </LoadingWrapper>
        ),
      },
      {
        path: "orders",
        element: (
          <LoadingWrapper>
            <OrderManagementSystem />
          </LoadingWrapper>
        ),
      },
      {
        path: "livemap",
        element: (
          <ProtectedIsAuthRouteBusinessType
          element={
            
            <LoadingWrapper>
              <LiveMap />
            
            </LoadingWrapper>
            }
              expectedBusinessTypes={[
                BusinessTypeEnum?.DELIVERY_STANDARD,
                BusinessTypeEnum?.DELIVERY_ENTERPRISE,
              ]}
            />
        ),
      },
      {
        path: "vendors",
        element: (
          <ProtectedIsAuthRouteBusinessType
          element={
                <LoadingWrapper>
              <VendorsByDeliveryService />
            
              </LoadingWrapper>
            }
              expectedBusinessTypes={[
                BusinessTypeEnum?.DELIVERY_STANDARD,
                BusinessTypeEnum?.DELIVERY_ENTERPRISE,
              ]}
            />
        ),
      },
      {
        path: "zone",
        element: (
          <ProtectedIsAuthRouteBusinessType
            element={
              <LoadingWrapper>
                <RiderZoneSetup />
              </LoadingWrapper>
            }
            expectedBusinessTypes={[
              BusinessTypeEnum?.DELIVERY_STANDARD,
              BusinessTypeEnum?.DELIVERY_ENTERPRISE,
            ]}
          />
        ),
      },
      {
        path: "time",
        element: (
          <LoadingWrapper>
            <ProtectedIsAuthRouteBusinessType
              element={<AvailabilityPage />}
              expectedBusinessTypes={[
                BusinessTypeEnum?.DELIVERY_STANDARD,
                BusinessTypeEnum?.DELIVERY_ENTERPRISE,
              ]}
            />
          </LoadingWrapper>
        ),
      },
      {
        path: "builder",
        element: (
          <ProtectedIsAuthRouteBusinessType
          element={
                <LoadingWrapper>
              
              <FormAndRequestTabs />
            
            
              </LoadingWrapper>
            }
              expectedBusinessTypes={[
                BusinessTypeEnum?.ECOMMERCE_ENTERPRISE,
                BusinessTypeEnum?.DELIVERY_ENTERPRISE,
              ]}
            />
        ),
      },
      // {
      //   path: "analytics",
      //   element: (
      //     <LoadingWrapper>
      //       <Analytics />
      //     </LoadingWrapper>
      //   )
      // },
      
      {
        path: "history",
        element: (
          <LoadingWrapper>
            <ServiceHistory />
          </LoadingWrapper>
        ),
      },
    ],
  },
]);

export function Navigation() {
  return (
    <ApolloProvider client={Client}>
      <ThemeProvider>
        <SidebarProvider>
          <OrderTrackingProvider>
            <AuthProvider>
              <RouterProvider router={router} />
              <Toaster />
            </AuthProvider>
          </OrderTrackingProvider>
        </SidebarProvider>
      </ThemeProvider>
    </ApolloProvider>
  );
}

export function SidebarLayoutProvider() {
  const { firstProfileId } = useProfileUpdate(null);
  const serviceId = firstProfileId;

  return (
    <div className="flex w-full h-screen overflow-hidden">
      <ProviderContextProvider serviceId={serviceId ?? ""}>
        <ScrollArea className="h-full border-r">
          <Sidebar />
        </ScrollArea>
        <ScrollArea className="flex-1 p-1">
          <Outlet />
        </ScrollArea>
      </ProviderContextProvider>
    </div>
  );
}

export function Layout() {
  const { serviceId: updateServiceId } = useParams<{ serviceId: string }>();
  const { firstProfileId } = useProfileUpdate(null);
  const serviceId = firstProfileId ?? updateServiceId;

  console.log("Service ID in Layout:", serviceId);

  return (
    <div className="flex w-full h-screen overflow-hidden bg-cyan-100/20">
      <ProviderContextProvider serviceId={serviceId ?? ""}>
        <CartProvider>
          <ScrollArea className="h-full border-r">
            <SidebarMain serviceId={serviceId} />
          </ScrollArea>
          <ScrollArea className="flex-1 p-2">
            <CartDrawer />
            <Outlet />
          </ScrollArea>
        </CartProvider>
      </ProviderContextProvider>
    </div>
  );
}

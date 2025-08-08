import { ApolloProvider } from "@apollo/client";
import { createBrowserRouter, RouterProvider, useParams } from "react-router";
import React, { Suspense } from "react";
import Client from "..";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth, useProfileUpdate } from "./context/authContext";
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
import ServiceProviderPandP from "@/components/serviceProviders/p&p";
import { useNotificationDialog } from "@/components/global/notification/usePushNotifications";
import { NotificationDialog } from "@/components/global/notification/notification-dialog";
import { PushDebugTools } from "@/components/GlobalLogic/PushDebugTools";
import LucideIconPicker from "@/app/vendors/icons";
import InventoryItemForm from "@/app/vendors/rentalBasedBooking/createRentals";
import RequestItems from "@/vendor/products/requestItem";
import DragDropBoxes from "@/vendor/products/cate";
import CategoryDetailPage from "@/vendor/products/cate/categoryDetail";
import UpdateRiderProfile from "@/components/rider/updateRiderProfile";
import CheckUserAndRiderUpdates from "@/components/GlobalLogic/UserAndRiderUpdates";
import { ErrorBoundary } from "@/components/GlobalLogic/ErrorBoundary";
import { AdminSidebar } from "@/components/Admin/components/adminSide";
import ServiceProvidersPage from "@/components/Admin/pages/service";
import RidersPage from "@/components/Admin/pages/riders";
import UsersPage from "@/components/Admin/pages/users";
// import StandardDelveryRiderServiceLiveMap from "@/components/serviceProviders/DELIVERY_STANDARD/LiveMap";
// import { MainDeliveryZoneCreator } from "@/components/user/Location/vendor/mapsWork/RiderDeliverySys/create";

// Lazy-loaded components - Pages & Large Components
// const ServiceProvidersDirectory = React.lazy(() => import("@/components/serviceProviders/allProviders"));
const ServiceProviderProfile = React.lazy(
  () => import("@/components/serviceProviders/profile")
);
const StandardDelveryRiderServiceLiveMap = React.lazy(
  () => import("@/components/serviceProviders/DELIVERY_STANDARD/LiveMap")
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
      {
        path: "/category/:categoryId",
        element: <CategoryDetailPage />,
      },
      {
        path: "/push",
        element: <PushDebugTools />,
      },
      // {
      //   path: "/mamp",
      //   element: (
      //     <LoadingWrapper>
      //       <DeliveryTrackingMap />
      //     </LoadingWrapper>
      //   )
      // },
      {
        path: "/pp/:serviceId",
        element: (
          <LoadingWrapper>
            <ServiceProviderPandP />
          </LoadingWrapper>
        ),
      },
      {
        path: "/pp",
        element: (
          <LoadingWrapper>
            <ServiceProviderPandP />
          </LoadingWrapper>
        ),
      },
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
        path: "/dd/:riderId/:bookId", //change from /multidelivery to dd and no need for /delivery
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
        path: "livemap",
        element: (
          <ProtectedProfileBusinessTypeRoute
            element={
              <LoadingWrapper>
                <StandardDelveryRiderServiceLiveMap />
              </LoadingWrapper>
            }
            expectedBusinessTypes={[BusinessTypeEnum?.DELIVERY_STANDARD]}
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
        path: "/update",
        element: (
          <>
            <CheckUserAndRiderUpdates />
          </>
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
        path: "/vob/:entityId",
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
            expectedTypes={[BusinessTypeEnum.DELIVERY_ENTERPRISE]}
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

      /// standard deleivery
      {
        path: "contacts",
        element: (
          <LoadingWrapper>
            <SearchData />
          </LoadingWrapper>
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
        path: "upload",
        element: (
          <LoadingWrapper>
            <CreateGalleryForm />
          </LoadingWrapper>
        ),
      },
      {
        path: "social/:serviceId",
        element: <SocialForm />,
      },
      {
        path: "social",
        element: <SocialForm />,
      },
      {
        path: "update",
        element: (
          <ProtectedIsAuthRoute
            expectedTypes={[BusinessTypeEnum.DELIVERY_STANDARD,BusinessTypeEnum.ECOMMERCE_STANDARD]}
            element={
              <LoadingWrapper>
                <ProfileService />
              </LoadingWrapper>
            }
          />
        ),
      },
    ],
  },
  // Routes with sidebar layout using Outlet
  {
    path: "/dbp/",
    element: (
      <ProtectedIsAuthRoute
        expectedTypes={[
          BusinessTypeEnum.DELIVERY_ENTERPRISE,
          BusinessTypeEnum.ECOMMERCE_ENTERPRISE,
          BusinessTypeEnum.ECOMMERCE_STANDARD,
          BusinessTypeEnum.DROP_SHIPPING,
        ]}
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
        path: "social/:serviceId",
        element: <SocialForm />,
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
            expectedTypes={[
              BusinessTypeEnum.DELIVERY_ENTERPRISE,
              BusinessTypeEnum.ECOMMERCE_ENTERPRISE,
              BusinessTypeEnum.ECOMMERCE_STANDARD,
              BusinessTypeEnum.DROP_SHIPPING,


            ]}
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
      { path: "cate", element: <DragDropBoxes /> },

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
              BusinessTypeEnum.DELIVERY_ENTERPRISE,
              BusinessTypeEnum.ECOMMERCE_ENTERPRISE,
              BusinessTypeEnum.DROP_SHIPPING,
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
              BusinessTypeEnum.DELIVERY_ENTERPRISE,
              BusinessTypeEnum.ECOMMERCE_ENTERPRISE,
              BusinessTypeEnum.DROP_SHIPPING,
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
              BusinessTypeEnum.DELIVERY_ENTERPRISE,
              BusinessTypeEnum.ECOMMERCE_ENTERPRISE,
              BusinessTypeEnum.DROP_SHIPPING,
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
                BusinessTypeEnum.DELIVERY_ENTERPRISE,
                BusinessTypeEnum.ECOMMERCE_ENTERPRISE,
                BusinessTypeEnum.DROP_SHIPPING,
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
              BusinessTypeEnum.DELIVERY_ENTERPRISE,
              BusinessTypeEnum.ECOMMERCE_ENTERPRISE,
              BusinessTypeEnum.DROP_SHIPPING,
            ]}
          />
        ),
      },
    

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
   {
    path: "/ddst/",
    element: (
      <LoadingWrapper>
            <SidebarLayoutAdmin />
          </LoadingWrapper>
    ),
    children: [
      {
        index: true,
        element: (
           <ServiceProvidersPage/>
        ),
      },
      {
        path: "riders",
        element: (
           <RidersPage />
        ),
      },
       {
        path: "users",
        element: (
           <UsersPage />
        ),
      }
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
  const { showDialog, closeDialog, isSupported } = useNotificationDialog();
  const { isAuthenticated } = useAuth();

  return (
    // <div className="flex w-full h-screen overflow-hidden">
    //   <ProviderContextProvider serviceId={serviceId ?? ""}>
    //     {/* <ScrollArea className="h-full border-r"> */}
    //       <Sidebar />
    //     {/* </ScrollArea> */}
    //     <ScrollArea className="flex-1 p-1">
    //       <Outlet />
    //     </ScrollArea>
    //   </ProviderContextProvider>
    // </div>
    <div className="flex w-full h-screen overflow-hidden bg-cyan-100/20">
      <ProviderContextProvider serviceId={serviceId ?? ""}>
        <>
          <div>
            {isAuthenticated && (
              <NotificationDialog isOpen={showDialog} onClose={closeDialog} />
            )}
          </div>
          {/* <ScrollArea className="h-full border-r"> */}
          <Sidebar />
          {/* </ScrollArea> */}
          <ScrollArea className="flex-1">
            <Outlet />
          </ScrollArea>
          {/* </div> */}
        </>
      </ProviderContextProvider>
    </div>
  );
}
export function SidebarLayoutAdmin() {
  const { firstProfileId } = useProfileUpdate(null);
  const serviceId = firstProfileId;
  const { showDialog, closeDialog, isSupported } = useNotificationDialog();
  const { isAuthenticated } = useAuth();

  return (
    // <div className="flex w-full h-screen overflow-hidden">
    //   <ProviderContextProvider serviceId={serviceId ?? ""}>
    //     {/* <ScrollArea className="h-full border-r"> */}
    //       <Sidebar />
    //     {/* </ScrollArea> */}
    //     <ScrollArea className="flex-1 p-1">
    //       <Outlet />
    //     </ScrollArea>
    //   </ProviderContextProvider>
    // </div>
    <div className="flex w-full h-screen overflow-hidden bg-cyan-100/20">
      <ProviderContextProvider serviceId={serviceId ?? ""}>
        <>
          <div>
            {isAuthenticated && (
              <NotificationDialog isOpen={showDialog} onClose={closeDialog} />
            )}
          </div>
          {/* <ScrollArea className="h-full border-r"> */}
          <AdminSidebar />
          {/* </ScrollArea> */}
          <ScrollArea className="flex-1">
            <Outlet />
          </ScrollArea>
          {/* </div> */}
        </>
      </ProviderContextProvider>
    </div>
  );
}
export function Layout() {
  const { serviceId: updateServiceId } = useParams<{ serviceId: string }>();
  const { firstProfileId } = useProfileUpdate(null);
  const serviceId = firstProfileId ?? updateServiceId;
  const { showDialog, closeDialog, isSupported } = useNotificationDialog();
  const { isAuthenticated } = useAuth();
  // console.log("Service ID in Layout:", serviceId);

  return (
    <div className="flex w-full h-screen overflow-hidden bg-cyan-100/20">
      <ProviderContextProvider serviceId={serviceId ?? ""}>
        <ErrorBoundary>
        <CartProvider>
          {/* <ScrollArea className="h-full border-r"> */}
          <SidebarMain serviceId={serviceId} />
          {/* </ScrollArea> */}
          <div>
            {isAuthenticated && (
              <NotificationDialog isOpen={showDialog} onClose={closeDialog} />
            )}
          </div>
          <CartDrawer />
          <ScrollArea className="flex-1">
            <Outlet />
          </ScrollArea>
          {/* </div> */}
        </CartProvider>
        </ErrorBoundary>
      </ProviderContextProvider>
    </div>
  );
}

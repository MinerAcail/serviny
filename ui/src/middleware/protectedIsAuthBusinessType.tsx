import { BusinessTypeEnum } from "@/components/serviceProviders/profile";
import { useAuth } from "@/middleware/context/authContext";
// import { useProvider, BusinessTypeEnum } from "@/middleware/context/providerContext";
import { Navigate } from "react-router";
import { useProvider } from "./context/businessType";
import { toast } from "sonner";

interface ProtectedBusinessTypeRouteProps {
  element: JSX.Element;
  expectedUserTypes?: ("SERVICE" | "RIDER")[];
  expectedBusinessTypes?: BusinessTypeEnum[];
  // Alternatively, use the computed boolean flags
  requireEcommerce?: boolean;
  requireEcommerceStandardOrEnterprise?: boolean;
  requireDeliveryStandardOrEnterprise?: boolean;
  requireDeliveryEnterprise?: boolean;
  requireDeliveryStandard?: boolean;
  requirePreOrderOrDropShipping?: boolean;
  redirectTo?: string;
  unauthorizedRedirect?: string;
  loadingComponent?: JSX.Element;
}

function ProtectedIsAuthRouteBusinessType({
  element,
  expectedUserTypes = [],
  expectedBusinessTypes = [],
  requireEcommerce = false,
  requireEcommerceStandardOrEnterprise = false,
  requireDeliveryStandardOrEnterprise = false,
  requireDeliveryEnterprise = false,
  requireDeliveryStandard = false,
  requirePreOrderOrDropShipping = false,
  redirectTo = "/",
  unauthorizedRedirect = "/unauthorized",
  loadingComponent
}: ProtectedBusinessTypeRouteProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    loading: providerLoading,
    error: providerError,
    data,
    userType,
    isEcommerceProvider,
    isEcommerceStandardOrEnterprise,
    isDeliveryStandardOrEnterprise,
    isDeliveryEnterprise,
    isDeliveryStandard,
    isPreOrderOrDropShipping,
  } = useProvider();

  const isLoading = authLoading || providerLoading;

  // Show loading state
  if (isLoading) {
    return loadingComponent || <div>Loading...</div>;
  }

  // Handle provider error
  if (providerError) {
    toast.error("Provider context error:", providerError);
    return <Navigate to={unauthorizedRedirect} replace />;
  }

  // Check authentication first
  if (!isAuthenticated) {
    toast.error(`User not authenticated, redirecting to: ${redirectTo}`);
    return <Navigate to={redirectTo} replace />;
  }

  // Check user type if specified
  if (expectedUserTypes.length > 0 && !expectedUserTypes.includes(userType)) {
    toast.error(
      `Access denied. User type: ${userType}, Expected: [${expectedUserTypes.join(", ")}]`
    );
    return <Navigate to={unauthorizedRedirect} replace />;
  }

  // Check specific business types if specified
  const currentBusinessType = data?.getProvider?.businessType;
  if (expectedBusinessTypes.length > 0) {
    if (!currentBusinessType || !expectedBusinessTypes.includes(currentBusinessType)) {
      toast.error(
        `Access denied. Business type: ${currentBusinessType}, Expected: [${expectedBusinessTypes.join(", ")}]`
      );
      return <Navigate to={unauthorizedRedirect} replace />;
    }
  }

  // Check business type flags
  const businessTypeChecks = [
    { flag: requireEcommerce, condition: isEcommerceProvider, name: "ecommerce" },
    { flag: requireEcommerceStandardOrEnterprise, condition: isEcommerceStandardOrEnterprise, name: "ecommerce standard/enterprise" },
    { flag: requireDeliveryStandardOrEnterprise, condition: isDeliveryStandardOrEnterprise, name: "delivery standard/enterprise" },
    { flag: requireDeliveryEnterprise, condition: isDeliveryEnterprise, name: "delivery enterprise" },
    { flag: requireDeliveryStandard, condition: isDeliveryStandard, name: "delivery standard" },
    { flag: requirePreOrderOrDropShipping, condition: isPreOrderOrDropShipping, name: "pre-order/drop-shipping" },
  ];

  for (const check of businessTypeChecks) {
    if (check.flag && !check.condition) {
      toast.error(`Access denied. Required business type: ${check.name}`);
      return <Navigate to={unauthorizedRedirect} replace />;
    }
  }

  console.log(
    `Access granted. User type: ${userType}, Business type: ${currentBusinessType}`
  );
  return element;
}

export default ProtectedIsAuthRouteBusinessType;
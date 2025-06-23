import { useAuth } from "@/middleware/context/authContext";

// import { BusinessTypeEnum } from "@/middleware/context/providerContext";
import { Navigate } from "react-router";
import { BusinessTypeEnum } from "./context/businessType";
import { useCurrentUserBusinessTypeWithConditions } from "@/components/GlobalLogic/checkBusinessType";

interface ProtectedProfileBusinessTypeRouteProps {
  element: JSX.Element;
  // Business type restrictions
  expectedBusinessTypes?: BusinessTypeEnum[];
  // Boolean flag restrictions (using computed conditions)
  requireEcommerce?: boolean;
  requireEcommerceStandardOrEnterprise?: boolean;
  requireDeliveryStandardOrEnterprise?: boolean;
  requireDeliveryEnterprise?: boolean;
  requireDeliveryStandard?: boolean;
  requirePreOrderOrDropShipping?: boolean;
  requireEnterprise?: boolean;
  // Custom validation function
  customValidation?: (profileInfo: { id: string; businessType: BusinessTypeEnum }) => boolean;
  // Redirect options
  redirectTo?: string;
  unauthorizedRedirect?: string;
  loadingComponent?: JSX.Element;
  // Debug mode
  debug?: boolean;
}

function ProtectedProfileBusinessTypeRoute({
  element,
  expectedBusinessTypes = [],
  requireEcommerce = false,
  requireEcommerceStandardOrEnterprise = false,
  requireDeliveryStandardOrEnterprise = false,
  requireDeliveryEnterprise = false,
  requireDeliveryStandard = false,
  requirePreOrderOrDropShipping = false,
  requireEnterprise = false,
  customValidation,
  redirectTo = "/login",
  unauthorizedRedirect = "/unauthorized",
  loadingComponent,
  debug = true
}: ProtectedProfileBusinessTypeRouteProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    profileInfo,
    businessType,
    conditions,
    loading: profileLoading,
    error: profileError
  } = useCurrentUserBusinessTypeWithConditions();

  const isLoading = authLoading || profileLoading;

  // Debug logging
  if (debug) {
    console.log("ProtectedProfileBusinessTypeRoute Debug:", {
      isAuthenticated,
      isLoading,
      profileInfo,
      businessType,
      conditions,
      profileError
    });
  }

  // Show loading state
  if (isLoading) {
    return loadingComponent || (
      <div className="loading-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  // Handle profile error
  if (profileError) {
    console.error("Profile context error:", profileError);
    if (debug) console.log("Redirecting due to profile error");
    return <Navigate to={unauthorizedRedirect} replace />;
  }

  // Check authentication first
  if (!isAuthenticated) {
    if (debug) console.log("User not authenticated, redirecting to:", redirectTo);
    return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />;
  }

  // Check if profile info exists
  if (!profileInfo || !businessType) {
    console.warn("No profile info or business type found for authenticated user");
    if (debug) console.log("No profile info, redirecting to:", unauthorizedRedirect);
    return <Navigate to={unauthorizedRedirect} replace />;
  }

  // Check specific business types if specified
  if (expectedBusinessTypes.length > 0) {
    if (!expectedBusinessTypes.includes(businessType)) {
      console.warn(
        `Access denied. Business type: ${businessType}, Expected: [${expectedBusinessTypes.join(", ")}]`
      );
      if (debug) console.log("Business type not in expected list");
      return <Navigate to={unauthorizedRedirect} replace />;
    }
  }

  // Check business type flags using conditions
  if (conditions) {
    const businessTypeChecks = [
      { flag: requireEcommerce, condition: conditions.isEcommerce, name: "ecommerce" },
      { flag: requireEcommerceStandardOrEnterprise, condition: conditions.isEcommerceStandardOrEnterprise, name: "ecommerce standard/enterprise" },
      { flag: requireDeliveryStandardOrEnterprise, condition: conditions.isDeliveryStandardOrEnterprise, name: "delivery standard/enterprise" },
      { flag: requireDeliveryEnterprise, condition: conditions.isDeliveryEnterprise, name: "delivery enterprise" },
      { flag: requireDeliveryStandard, condition: conditions.isDeliveryStandard, name: "delivery standard" },
      { flag: requirePreOrderOrDropShipping, condition: conditions.isPreOrderOrDropShipping, name: "pre-order/drop-shipping" },
      { flag: requireEnterprise, condition: conditions.isEnterprise, name: "enterprise" },
    ];

    for (const check of businessTypeChecks) {
      if (check.flag && !check.condition) {
        console.warn(`Access denied. Required business type: ${check.name}`);
        if (debug) console.log(`Failed business type check: ${check.name}`);
        return <Navigate to={unauthorizedRedirect} replace />;
      }
    }
  }

  // Custom validation if provided
  if (customValidation && !customValidation(profileInfo)) {
    console.warn("Access denied by custom validation");
    if (debug) console.log("Failed custom validation");
    return <Navigate to={unauthorizedRedirect} replace />;
  }

  if (debug) {
    console.log(
      `Access granted. Profile ID: ${profileInfo.id}, Business type: ${businessType}`
    );
  }

  return element;
}

export default ProtectedProfileBusinessTypeRoute;
// import { BusinessTypeEnum } from "@/middleware/context/businessType";
import { gql, useQuery, useLazyQuery, ApolloClient, type NormalizedCacheObject  } from "@apollo/client";
import { BusinessTypeEnum } from "./BusinessTypeEnum";
// import { BusinessTypeEnum } from "@/middleware/context/providerContext";

const GET_CURRENT_USER_PROFILE_INFO = gql`
  query GetAProfileBusinessTypeByUserId {
    getAProfileBusinessTypeByUserId {
      id
      businessType
    }
  }
`;

// Type for the profile info response
type ProfileInfo = {
  id: string;
  businessType: BusinessTypeEnum;
};

type GetCurrentUserProfileInfoResponse = {
  getAProfileBusinessTypeByUserId: ProfileInfo;
};

// Hook to get current user's profile info
export function useCurrentUserProfileInfo() {
  const { data, loading, error, refetch } = useQuery<GetCurrentUserProfileInfoResponse>(
    GET_CURRENT_USER_PROFILE_INFO
  );

  return {
    profileInfo: data?.getAProfileBusinessTypeByUserId || null,
    profileId: data?.getAProfileBusinessTypeByUserId?.id || null,
    businessType: data?.getAProfileBusinessTypeByUserId?.businessType || null,
    loading,
    error,
    refetch,
  };
}

// Hook to get only current user's business type (for backward compatibility)
export function useCurrentUserBusinessType() {
  const { businessType, loading, error, refetch } = useCurrentUserProfileInfo();
  
  return {
    businessType,
    loading,
    error,
    refetch,
  };
}

// Lazy query hook for manual triggering
export function useCurrentUserProfileInfoLazy() {
  const [getProfileInfo, { data, loading, error }] = useLazyQuery<GetCurrentUserProfileInfoResponse>(
    GET_CURRENT_USER_PROFILE_INFO
  );

  const fetchProfileInfo = async (): Promise<ProfileInfo | null> => {
    try {
      const result = await getProfileInfo();
      return result.data?.getAProfileBusinessTypeByUserId || null;
    } catch (err) {
      console.error("Error fetching current user profile info:", err);
      return null;
    }
  };

  const fetchBusinessType = async (): Promise<BusinessTypeEnum | null> => {
    const profileInfo = await fetchProfileInfo();
    return profileInfo?.businessType || null;
  };

  return {
    fetchProfileInfo,
    fetchBusinessType,
    profileInfo: data?.getAProfileBusinessTypeByUserId || null,
    businessType: data?.getAProfileBusinessTypeByUserId?.businessType || null,
    loading,
    error,
  };
}

// Apollo Client function for use outside React components
export async function getCurrentUserProfileInfo(
  client: ApolloClient<NormalizedCacheObject>
): Promise<{
  profileInfo: ProfileInfo | null;
  error?: string;
}> {
  try {
    const { data, error } = await client.query<GetCurrentUserProfileInfoResponse>({
      query: GET_CURRENT_USER_PROFILE_INFO,
      fetchPolicy: 'cache-first',
      errorPolicy: 'all'
    });

    if (error) {
      console.error("GraphQL error:", error);
      return {
        profileInfo: null,
        error: error.message
      };
    }

    return {
      profileInfo: data?.getAProfileBusinessTypeByUserId || null,
      error: undefined
    };

  } catch {
    // console.error("Error fetching current user profile info:", error);
    return {
      profileInfo: null,
      error:  "Failed to fetch user profile info"
    };
  }
}

// Simple function to get only the business type (backward compatibility)
export async function getCurrentUserBusinessType(
  client: ApolloClient<NormalizedCacheObject>
): Promise<{
  businessType: BusinessTypeEnum | null;
  error?: string;
}> {
  const result = await getCurrentUserProfileInfo(client);
  return {
    businessType: result.profileInfo?.businessType || null,
    error: result.error
  };
}

// Simple function to get only the business type value
export async function getCurrentBusinessTypeOnly(
  client: ApolloClient<NormalizedCacheObject>
): Promise<BusinessTypeEnum | null> {
  const result = await getCurrentUserProfileInfo(client);
  return result.profileInfo?.businessType || null;
}

// Function to get profile ID
export async function getCurrentUserProfileId(
  client: ApolloClient<NormalizedCacheObject>
): Promise<string | null> {
  const result = await getCurrentUserProfileInfo(client);
  return result.profileInfo?.id || null;
}

// Function to check if current user has specific business type
export async function currentUserHasBusinessType(
  client: ApolloClient<NormalizedCacheObject>,
  expectedBusinessType: BusinessTypeEnum
): Promise<boolean> {
  const businessType = await getCurrentBusinessTypeOnly(client);
  return businessType === expectedBusinessType;
}

// Function to check if current user has any of the specified business types
export async function currentUserHasAnyBusinessType(
  client: ApolloClient<NormalizedCacheObject>,
  expectedBusinessTypes: BusinessTypeEnum[]
): Promise<boolean> {
  const businessType = await getCurrentBusinessTypeOnly(client);
  return businessType ? expectedBusinessTypes.includes(businessType) : false;
}

// Utility function to check business type conditions
export function checkBusinessTypeConditions(businessType: BusinessTypeEnum | null | undefined) {
  if (!businessType) return null;

  return {
    businessType,
    
    isEcommerce: [
      BusinessTypeEnum.ECOMMERCE_STANDARD,
      BusinessTypeEnum.ECOMMERCE_ENTERPRISE,
      BusinessTypeEnum.PRE_ORDER,
      BusinessTypeEnum.DROP_SHIPPING,
    ].includes(businessType),
    
    isEcommerceStandardOrEnterprise: [
      BusinessTypeEnum.ECOMMERCE_STANDARD,
      BusinessTypeEnum.ECOMMERCE_ENTERPRISE,
    ].includes(businessType),
    
    isDelivery: [
      BusinessTypeEnum.DELIVERY_STANDARD,
      BusinessTypeEnum.DELIVERY_ENTERPRISE,
    ].includes(businessType),
    
    isDeliveryEnterprise: businessType === BusinessTypeEnum.DELIVERY_ENTERPRISE,
    isDeliveryStandard: businessType === BusinessTypeEnum.DELIVERY_STANDARD,
    
    isPreOrderOrDropShipping: [
      BusinessTypeEnum.PRE_ORDER,
      BusinessTypeEnum.DROP_SHIPPING,
    ].includes(businessType),
    
    isEnterprise: [
      BusinessTypeEnum.ECOMMERCE_ENTERPRISE,
      BusinessTypeEnum.DELIVERY_ENTERPRISE,
    ].includes(businessType),
  };
}

// Hook that combines profile info with business type conditions
export function useCurrentUserBusinessTypeWithConditions() {
  const { profileInfo, businessType, loading, error, refetch } = useCurrentUserProfileInfo();
  const conditions = checkBusinessTypeConditions(businessType);

  return {
    profileInfo,
    profileId: profileInfo?.id || null,
    businessType,
    conditions,
    loading,
    error,
    refetch,
  };
}

// Hook to check if current user has specific business type
export function useCurrentUserHasBusinessType(expectedBusinessType: BusinessTypeEnum): boolean {
  const { businessType } = useCurrentUserBusinessType();
  return businessType === expectedBusinessType;
}

// Hook to check if current user has any of the specified business types
export function useCurrentUserHasAnyBusinessType(expectedBusinessTypes: BusinessTypeEnum[]): boolean {
  const { businessType } = useCurrentUserBusinessType();
  return businessType ? expectedBusinessTypes.includes(businessType) : false;
}

// Hook for feature access based on business type
export function useCurrentUserFeatureAccess(feature: string): boolean {
  const { conditions } = useCurrentUserBusinessTypeWithConditions();
  
  if (!conditions) return false;
  
  switch (feature) {
    case 'advanced-analytics':
      return conditions.isEnterprise;
    case 'inventory-management':
      return conditions.isEcommerce;
    case 'route-optimization':
      return conditions.isDelivery;
    case 'bulk-orders':
      return conditions.isEcommerceStandardOrEnterprise;
    case 'special-shipping':
      return conditions.isPreOrderOrDropShipping;
    default:
      return false;
  }
}

// Hook to get current user's profile ID
export function useCurrentUserProfileId(): string | null {
  const { profileId } = useCurrentUserProfileInfo();
  return profileId;
}
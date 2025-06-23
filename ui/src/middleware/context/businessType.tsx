import React, { createContext, useContext, useMemo, ReactNode } from "react";
import { useQuery, gql } from "@apollo/client";
import { useAuth } from "./authContext";

export enum BusinessTypeEnum {
  ECOMMERCE_STANDARD = "ecommerce-standard",
  ECOMMERCE_ENTERPRISE = "ecommerce-enterprise",
  PRE_ORDER = "pre-order",
  DROP_SHIPPING = "drop-shipping",
  DELIVERY_STANDARD = "delivery-standard",
  DELIVERY_ENTERPRISE = "delivery-enterprise",
}

type Provider = {
  id: string;
  dpfile: string;
  name: string;
  number: string;
  email: string;
  profession: string;
  categories: string[];
  aboutMe: string;
  location: string;
  createdAt: string;
  businessType: BusinessTypeEnum;
  coordinates: string;
  type?: "SERVICE" | "RIDER"; // Added the missing type field
};

type ProviderContextType = {
  data?: { getProvider: Provider };
  loading: boolean;
  error?: any;
  userType: "SERVICE" | "RIDER";
  isEcommerceProvider: boolean;
  isEcommerceStandardOrEnterprise: boolean;
  isDeliveryStandardOrEnterprise: boolean;
  isDeliveryEnterprise: boolean;
  isDeliveryStandard: boolean;
  isPreOrderOrDropShipping: boolean;
};

const ProviderContext = createContext<ProviderContextType | undefined>(
  undefined
);

export const useProvider = (): ProviderContextType => {
  const context = useContext(ProviderContext);
  if (!context) {
    throw new Error(
      "useProvider must be used within a ProviderContextProvider"
    );
  }
  return context;
};

const GET_PROVIDER = gql`
  query getProvider($serviceId: String!) {
    getProvider(ServiceId: $serviceId) {
      id
      dpfile
      name
      number
      email
      profession
      categories
      aboutMe
      location
      createdAt
      businessType
      coordinates
      type
    }
  }
`;

type ProviderContextProviderProps = {
  serviceId: string;
  children: ReactNode;
};

export const ProviderContextProvider: React.FC<
  ProviderContextProviderProps
> = ({ serviceId, children }) => {
  const [userType, setUserType] = React.useState<"SERVICE" | "RIDER">(
    "SERVICE"
  );
  const { user } = useAuth();
  const serid = user?.id;
  // console.log("ppt Service ID:", serviceId, "User ID:", serid);

  const { data, loading, error } = useQuery(GET_PROVIDER, {
    variables: { serviceId: serid },
  });

  React.useEffect(() => {
    if (data?.getProvider?.type) {
      setUserType(data.getProvider.type);
    }
  }, [data]);

  const isEcommerceProvider = useMemo(() => {
    const type = data?.getProvider?.businessType;
    return (
      type === BusinessTypeEnum.PRE_ORDER ||
      type === BusinessTypeEnum.DROP_SHIPPING ||
      type === BusinessTypeEnum.ECOMMERCE_STANDARD ||
      type === BusinessTypeEnum.ECOMMERCE_ENTERPRISE
    );
  }, [data]);

  const isEcommerceStandardOrEnterprise = useMemo(() => {
    const type = data?.getProvider?.businessType;
    return (
      type === BusinessTypeEnum.ECOMMERCE_STANDARD ||
      type === BusinessTypeEnum.ECOMMERCE_ENTERPRISE
    );
  }, [data]);

  const isDeliveryStandardOrEnterprise = useMemo(() => {
    const type = data?.getProvider?.businessType;
    return (
      type === BusinessTypeEnum.DELIVERY_ENTERPRISE ||
      type === BusinessTypeEnum.DELIVERY_STANDARD
    );
  }, [data]);

  const isDeliveryEnterprise = useMemo(() => {
    const type = data?.getProvider?.businessType;
    return type === BusinessTypeEnum.DELIVERY_ENTERPRISE;
  }, [data]);

  const isDeliveryStandard = useMemo(() => {
    const type = data?.getProvider?.businessType;
    return type === BusinessTypeEnum.DELIVERY_STANDARD;
  }, [data]);

  const isPreOrderOrDropShipping = useMemo(() => {
    const type = data?.getProvider?.businessType;
    return (
      type === BusinessTypeEnum.PRE_ORDER ||
      type === BusinessTypeEnum.DROP_SHIPPING
    );
  }, [data]);

  return (
    <ProviderContext.Provider
      value={{
        data,
        userType,
        loading,
        error,
        isEcommerceProvider,
        isEcommerceStandardOrEnterprise,
        isDeliveryStandardOrEnterprise,
        isDeliveryEnterprise,
        isDeliveryStandard,
        isPreOrderOrDropShipping,
      }}
    >
      {children}
    </ProviderContext.Provider>
  );
};

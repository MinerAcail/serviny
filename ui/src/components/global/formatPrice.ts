import { Production } from "@/index";
import { gql, useQuery } from "@apollo/client";
import { type Libraries } from "@react-google-maps/api";
import { useEffect } from "react";

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
  }).format(price);
}
const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const libraries: Libraries = ["places"];

//
export const GOOGLE_MAPS_CONFIG = {
  id: "google-map-script",
  googleMapsApiKey: googleMapsApiKey,
  libraries: libraries,
};
// const Production = true; 

const API_URL = Production ? `https://files.winnemart.com/` : `http://localhost:9000`;
// const API_URL = 'http://localhost:9000';

export const getImageUrl = (dpfilePath: string | null | undefined): string | null => {
  if (!dpfilePath) return null;

  // If '/minio/' is present, replace it; otherwise, return the original string
  if (!Production) return dpfilePath;
  
  if (dpfilePath.includes('/minio/')) {
    return dpfilePath.replace('/minio/', API_URL);
  }
  
  return dpfilePath;
};

export const GET_PROVIDER = gql`
  query getProvider($serviceId: String) {
    getProvider(ServiceId: $serviceId) {
      id
      name
      businessType
    }
  }
`;

export function useGetProvider({ serviceId }: { serviceId: string }) {
  const { data } = useQuery(GET_PROVIDER, {
    variables: { serviceId }
  });

  useEffect(() => {
    if (data?.getProvider?.id) {
      localStorage.setItem("serviceId", data.getProvider.id);
    }
  }, [data?.getProvider?.id]);

  return {
    id: data?.getProvider?.id ?? null,
    name: data?.getProvider?.name ?? null,
    businessType: data?.getProvider?.businessType ?? null
  };
}
import { useAuth } from "./context/authContext";



const useProtect = (expectedTypes?: string[]) => {
  const { isAuthenticated, user } = useAuth();
  const userTypes: string[] = Array.isArray(user?.type) ? user?.type : [user?.type ?? '']; // Ensure it's an array

  const hasAccess =
    isAuthenticated &&
    (!expectedTypes || expectedTypes.some((type) => userTypes.includes(type)));

  return { hasAccess, isAuthenticated };
};

export default useProtect;

export const ProtectType = {
  Driver: "Driver",
  Dispatch: "Dispatch",
  vendor: "VENDOR",
  Advertiser:"Advertiser",
  Service:"SERVICE",
  User:"USER",
  Rider:"DELIVERY"
} as const;

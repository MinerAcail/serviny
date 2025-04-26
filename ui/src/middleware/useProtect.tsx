import { useAuth } from "./context/authContext";

// interface User {
//   type: string[]; // Ensure it's an array of strings
//   // Other user properties
// }

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
  Service:"SERVICE"
} as const;

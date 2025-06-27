import { useAuth } from "@/middleware/context/authContext";



export const useProtect = (expectedTypes?: string[]) => {
  const { isAuthenticated, user } = useAuth();
  const userTypes: string[] = Array.isArray(user?.type) ? user?.type : [user?.type ?? '']; 

  const hasAccess =
    isAuthenticated &&
    (!expectedTypes || expectedTypes.some((type) => userTypes.includes(type)));

  return { hasAccess, isAuthenticated };
};



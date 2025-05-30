import React, { createContext, useContext, useEffect, useState } from "react";
// import jwtDecode, { JwtPayload } from "jwt-decode";

interface AuthProviderProps {
  children: React.ReactNode;
}

interface UserType {
  id: string;
  name: string;
  email: string;
  type: string; // Changed to an array of strings for multiple types
  number: string;
}
// GraphQL query to clear the client cache


// Create an authentication context
const AuthContext = createContext<{
  isAuthenticated: boolean;
  user: UserType | null;
  login: (user: UserType) => void;
  logout: () => void;
  isLoading: boolean;
  clearCache: () => void;
} | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // New loading state
// Hook to execute the clear cache query
//   const [clearClientCache,{data}] = useLazyQuery(CLEAR_CLIENT_CACHE, {
//     onCompleted: (data) => {
//       if (data.clearClientCache) {
//         // Clear localStorage when server confirms
//         clearLocalStorage();
//       }
//     },
//     onError: (error) => {
//       console.error("Error clearing client cache:", error);
//       // Still clear localStorage even if server call fails
//       clearLocalStorage();
//     }
//   });
// console.log("clearClientCache initialized",data);	

  // Function to clear localStorage
  const clearLocalStorage = () => {
    try {
      localStorage.removeItem("userData");
      // Or clear everything: localStorage.clear();
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }
  };
  useEffect(() => {
    // Check if there is user data in localStorage when the component mounts
    try {
      const storedUserData = localStorage.getItem("userData");
      if (storedUserData) {
        // Parse and set the user data from localStorage
        const parsedUser = JSON.parse(storedUserData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
    } finally {
      setIsLoading(false); // Set loading to false after check
    }
  }, []);

  // Function to handle login
  const login = (userData: UserType) => {
    try {
      localStorage.setItem("userData", JSON.stringify(userData)); // Store user data
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Error saving user to localStorage:", error);
    }
  };

  // Function to handle logout
  const logout = () => {
       // Trigger the GraphQL query to clear cache
    clearLocalStorage();
    setIsAuthenticated(false);
    setUser(null);
    // localStorage.removeItem("userData"); // Remove user data from storage
  };
// Function to manually clear cache (if needed elsewhere)
  const clearCache = () => {
    clearLocalStorage();
  };
  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout,isLoading,clearCache }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to access the authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

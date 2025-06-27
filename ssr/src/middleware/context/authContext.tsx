import { gql, useLazyQuery } from "@apollo/client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface AuthProviderProps {
  children: React.ReactNode;
}

interface UserType {
  id: string;
  name: string;
  email: string;
  type: string;
  number: string;
}

const GET_USER_INFO_FROM_CONTEXT = gql`
  query GetUserInforFromContextForAuthClient {
    getUserInforFromContextForAuthClient {
      id
      number
      name
      email
      type
    }
  }
`;

const AuthContext = createContext<
  | {
      isAuthenticated: boolean;
      user: UserType | null;
      login: (user: UserType) => void;
      logout: () => void;
      isLoading: boolean;
      clearCache: () => void;
      syncWithServer: () => void;
    }
  | undefined
>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Use lazy query for getUserInforFromContextForAuthClient
  const [getUserInfo, { loading: userContextLoading }] = useLazyQuery(
    GET_USER_INFO_FROM_CONTEXT,
    {
      fetchPolicy: "network-only", // Always fetch from server
      onCompleted: (data) => {
        if (data?.getUserInforFromContextForAuthClient) {
          const serverUser = data.getUserInforFromContextForAuthClient;

          // Update local state and localStorage with server data
          setUser(serverUser);
          setIsAuthenticated(true);

          try {
            localStorage.setItem("userData", JSON.stringify(serverUser));
          } catch (error) {
            console.error(
              "Error saving server user data to localStorage:",
              error
            );
          }
        } else {
          // No user found on server, clear local data
          handleNoServerUser();
        }
        setIsLoading(false);
      },
      onError: (error) => {
        console.error("Error fetching user info from server:", error);
        // On error, check localStorage as fallback
        checkLocalStorageOnly();
        setIsLoading(false);
      },
    }
  );

  const handleNoServerUser = () => {
    // Clear local storage if server has no user data
    clearLocalStorage();
    setIsAuthenticated(false);
    setUser(null);
  };

  const checkLocalStorageOnly = () => {
    // Fallback to localStorage when server query fails
    try {
      const storedUserData = localStorage.getItem("userData");
      if (storedUserData) {
        const parsedUser = JSON.parse(storedUserData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
    }
  };

  const clearLocalStorage = () => {
    try {
      localStorage.removeItem("userData");
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }
  };

  // Function to manually sync with server
  const syncWithServer = useCallback(() => {
    if (!userContextLoading) {
      getUserInfo();
    }
  }, [getUserInfo, userContextLoading]);

  useEffect(() => {
    // On mount, try to get user info from server first
    getUserInfo();
  }, [getUserInfo]);

  const login = (userData: UserType) => {
    try {
      localStorage.setItem("userData", JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Error saving user to localStorage:", error);
    }
  };

  const logout = () => {
    clearLocalStorage();
    setIsAuthenticated(false);
    setUser(null);
  };

  const clearCache = () => {
    clearLocalStorage();
  };

  // Combine loading states
  const totalLoading = isLoading || userContextLoading;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        isLoading: totalLoading,
        clearCache,
        syncWithServer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

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

// Create an authentication context
const AuthContext = createContext<{
  isAuthenticated: boolean;
  user: UserType | null;
  login: (user: UserType) => void;
  logout: () => void;
  isLoading: boolean;
} | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // New loading state

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
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem("userData"); // Remove user data from storage
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout,isLoading }}>
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

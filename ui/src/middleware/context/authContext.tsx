import { gql, useApolloClient, useMutation, useQuery } from "@apollo/client";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
// import jwtDecode, { JwtPayload } from "jwt-decode";

interface AuthProviderProps {
  children: React.ReactNode;
}
export const PROFILES_MUTATION = gql`
  mutation Profiles($profileId: String!) {
    profiles(profileId: $profileId) {
      id
      type
      profileIds
    }
  }
`;
// Query: Get the current user's profile
export const GET_PROFILES_QUERY = gql`
  query GetProfiles {
    getProfiles {
      id
      type
      profileIds
    }
  }
`;
export const GET__A_PROFILEID_QUERY = gql`
query GetAProfileIDByUserID($userId:String){
  getAProfileIdByUserId(userId:$userId)
}
`;
export function useProfileUpdate(profileId: string | null | undefined, userId: string | null | undefined = null) {
  const client = useApolloClient();
  const [updateProfileMutation, { loading: updating, error: updateError }] = useMutation(PROFILES_MUTATION);

  const {
    data: getProfileData,
    loading: fetching,
    error: fetchError,
    refetch,
  } = useQuery(GET_PROFILES_QUERY);

  // Only query for profile ID if userId is provided
  const {
    data: AprofileIdData,
    loading: profileIdLoading,
    error: profileIdError
  } = useQuery(GET__A_PROFILEID_QUERY, {
    variables: { userId },
    skip: !userId, // Skip query if no userId provided
    fetchPolicy: 'cache-and-network'
  });

  const loading = updating || fetching || profileIdLoading;
  const error = updateError || fetchError || profileIdError;
  const profile = getProfileData?.getProfiles ?? null;
  const firstProfileId = profile?.profileIds?.[0] ?? null;
  const userProfileId = AprofileIdData?.getAProfileIdByUserId ?? null;

  // Track the last profileId we triggered
  const lastTriggeredIdRef = useRef<string | null>(null);

  // Trigger mutation
  const triggerUpdate = useCallback(
    async (newProfileId: string) => {
      try {
        const res = await updateProfileMutation({ variables: { profileId: newProfileId } });
        await refetch();
        lastTriggeredIdRef.current = newProfileId;
        return newProfileId; // Return the profileId instead of the full response
      } catch (err) {
        console.error("Profile update failed:", err);
        return null;
      }
    },
    [updateProfileMutation, refetch]
  );

  // New function to trigger update with firstProfileId
  const triggerUpdateWithFirstProfile = useCallback(async () => {
    if (firstProfileId) {
      return await triggerUpdate(firstProfileId);
    } else {
      console.warn("No firstProfileId available to trigger update");
      return null;
    }
  }, [firstProfileId, triggerUpdate]);

  // Function to get profile ID by user ID and then trigger update
  const triggerUpdateByUserId = useCallback(async (targetUserId: string) => {
    try {
      // Use Apollo client to execute the query for fresh data
      const { data } = await client.query({
        query: GET__A_PROFILEID_QUERY,
        variables: { userId: targetUserId },
        fetchPolicy: 'network-only', // Ensure fresh data
      });

      const profileIdFromUser = data?.getAProfileIdByUserId;
      
      if (profileIdFromUser) {
        const result = await triggerUpdate(profileIdFromUser);
        return profileIdFromUser; // Return the profileId, not the mutation result
      } else {
        console.warn("No profile ID found for user:", targetUserId);
        return null;
      }
    } catch (err) {
      console.error("Failed to get profile ID by user ID:", err);
      return null;
    }
  }, [triggerUpdate, client]);

  // Function to trigger update with the userId profile ID (from hook parameter)
  const triggerUpdateWithUserProfile = useCallback(async () => {
    if (userProfileId) {
      const result = await triggerUpdate(userProfileId);
      return userProfileId; // Return the profileId
    } else {
      console.warn("No userProfileId available to trigger update");
      return null;
    }
  }, [userProfileId, triggerUpdate]);

  // Automatically trigger if firstProfileId !== profileId
  useEffect(() => {
    if (
      profileId &&
      profileId !== firstProfileId &&
      profileId !== lastTriggeredIdRef.current
    ) {
      triggerUpdate(profileId);
    }
  }, [profileId, firstProfileId, triggerUpdate]);

  return {
    triggerUpdate,
    triggerUpdateWithFirstProfile,
    triggerUpdateByUserId,
    triggerUpdateWithUserProfile,
    profile,
    firstProfileId,
    userProfileId, // Expose the profile ID from userId
    loading,
    error,
    refetch,
  };
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
const AuthContext = createContext<
  | {
      isAuthenticated: boolean;
      user: UserType | null;
      login: (user: UserType) => void;
      logout: () => void;
      isLoading: boolean;
      clearCache: () => void;
    }
  | undefined
>(undefined);

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
    <AuthContext.Provider
      value={{ isAuthenticated, user, login, logout, isLoading, clearCache }}
    >
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

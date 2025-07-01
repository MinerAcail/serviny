import { gql, useApolloClient, useLazyQuery, useMutation, useQuery } from "@apollo/client";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

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
  query GetAProfileIDByUserID($userId: String) {
    getAProfileIdByUserId(userId: $userId)
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

  const {
    data: AprofileIdData,
    loading: profileIdLoading,
    error: profileIdError
  } = useQuery(GET__A_PROFILEID_QUERY, {
    variables: { userId },
    skip: !userId,
    fetchPolicy: 'cache-and-network'
  });

  const loading = updating || fetching || profileIdLoading;
  const error = updateError || fetchError || profileIdError;
  const profile = getProfileData?.getProfiles ?? null;
  const firstProfileId = profile?.profileIds?.[0] ?? null;
  const userProfileId = AprofileIdData?.getAProfileIdByUserId ?? null;

  const lastTriggeredIdRef = useRef<string | null>(null);

  const triggerUpdate = useCallback(
    async (newProfileId: string) => {
      try {
        const res = await updateProfileMutation({ variables: { profileId: newProfileId } });
        await refetch();
        lastTriggeredIdRef.current = newProfileId;
        return newProfileId;
      } catch (err) {
        console.error("Profile update failed:", err);
        return null;
      }
    },
    [updateProfileMutation, refetch]
  );

  const triggerUpdateWithFirstProfile = useCallback(async () => {
    if (firstProfileId) {
      return await triggerUpdate(firstProfileId);
    } else {
      console.warn("No firstProfileId available to trigger update");
      return null;
    }
  }, [firstProfileId, triggerUpdate]);

  const triggerUpdateByUserId = useCallback(async (targetUserId: string) => {
    try {
      const { data } = await client.query({
        query: GET__A_PROFILEID_QUERY,
        variables: { userId: targetUserId },
        fetchPolicy: 'network-only',
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

  const triggerUpdateWithUserProfile = useCallback(async () => {
    if (userProfileId) {
      const result = await triggerUpdate(userProfileId);
      return userProfileId; // Return the profileId
    } else {
      console.warn("No userProfileId available to trigger update");
      return null;
    }
  }, [userProfileId, triggerUpdate]);

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
  type: string;
  number: string;
}

export const GET_USER_INFO_FROM_CONTEXT = gql`
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
  const [getUserInfo, { data: userContextData, loading: userContextLoading, error: userContextError }] = useLazyQuery(
    GET_USER_INFO_FROM_CONTEXT,
    {
      fetchPolicy: 'network-only', // Always fetch from server
      onCompleted: (data) => {
        if (data?.getUserInforFromContextForAuthClient) {
          const serverUser = data.getUserInforFromContextForAuthClient;
          
          // Update local state and localStorage with server data
          setUser(serverUser);
          setIsAuthenticated(true);
          
          try {
            localStorage.setItem("userData", JSON.stringify(serverUser));
          } catch (error) {
            console.error("Error saving server user data to localStorage:", error);
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
      }
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
      getUserInfo();
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
        syncWithServer
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
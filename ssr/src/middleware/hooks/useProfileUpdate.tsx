import { gql, useApolloClient,  useMutation, useQuery } from "@apollo/client";
import  {  useCallback,  useEffect, useRef } from "react";

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
        await updateProfileMutation({ variables: { profileId: newProfileId } });
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
         await triggerUpdate(profileIdFromUser);
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
       await triggerUpdate(userProfileId);
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




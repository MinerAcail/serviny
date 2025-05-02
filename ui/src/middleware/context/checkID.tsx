import { gql, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";
import { useAuth } from "./authContext";

const GET_ID = gql`
  query getID {
    getID
  }
`;

export const useCheckAuthId = (targetId?: string) => {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const [isMatch, setIsMatch] = useState(false);

  const { data, loading: queryLoading, error } = useQuery(GET_ID, {
    skip: !isAuthenticated || !!targetId,
    fetchPolicy: "network-only",
  });

  const isLoading = authLoading || queryLoading;

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsMatch(false);
      return;
    }

    if (targetId) {
      setIsMatch(user.id === targetId);
    } else if (data?.getID) {
      setIsMatch(user.id === data.getID);
    } else {
      setIsMatch(false);
    }
  }, [isAuthenticated, user, data?.getID, targetId]);

  return {
    isMatch,
    setIsMatch,
    isLoading,
    error,
  };
};

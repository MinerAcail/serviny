import { useEffect } from "react";
import { gql, useMutation } from "@apollo/client";

const SEND_HEARTBEAT = gql`
  mutation SendHeartbeat {
    SendHeartbeat {
      userID
      isActive
      lastActive
    }
  }
`;

const HeartbeatUpdater = () => {
  const [sendHeartbeat] = useMutation(SEND_HEARTBEAT);

  useEffect(() => {
    const interval = setInterval(() => {
      sendHeartbeat().catch((err) => console.error("Heartbeat error:", err));
    }, 120000); // 2 minutes (120,000 milliseconds)

    return () => clearInterval(interval);
  }, [sendHeartbeat]);

  return null; // No UI needed, runs in the background
};

export default HeartbeatUpdater;

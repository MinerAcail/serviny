import { useAuth } from "@/middleware/context/authContext";
import RiderLiveMap from "../rider/LiveMap";
import UserServiceViewer from "../custom/USER_MAP_WORK/viewService";

function CheckBookingOrderDelivery() {
  const { user } = useAuth();
  const type = user?.type;
  console.log("User type in CheckBookingOrderDelivery:", type);
  

  return <>{type === "DELIVERY" ? <RiderLiveMap /> : <UserServiceViewer />}</>;
}

export default CheckBookingOrderDelivery;

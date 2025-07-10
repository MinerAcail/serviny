import { useAuth } from "@/middleware/context/authContext";
import RiderLiveMap from "../rider/LiveMap";
import UserServiceViewer from "../custom/USER_MAP_WORK/viewService";
import UpdateUserProfile from "../custom/users/updateUser";
import UpdateRiderProfile from "../rider/updateRiderProfile";
// import UserServiceViewer from "../custom/USER_MAP_WORK/viewService";
// import StandardDelveryRiderServiceLiveMap from "../serviceProviders/DELIVERY_STANDARD/LiveMap";

function CheckUserAndRiderUpdates() {
  const { user } = useAuth();
  const type = user?.type;
  console.log("User type in CheckUserAndRiderUpdates:", type);
  
  return (
    <div className="flex-1 p-2">
            {(() => {
        switch (type) {
          case "DELIVERY":
            return <UpdateRiderProfile />;
            case "USER":
            return <UpdateUserProfile />;
          default:
            return <UpdateUserProfile />;
        }
      })()}
    </div>
  );
}

export default CheckUserAndRiderUpdates;

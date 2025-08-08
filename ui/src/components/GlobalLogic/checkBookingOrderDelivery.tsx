import { useAuth } from "@/middleware/context/authContext";
import RiderLiveMap from "../rider/LiveMap";
import UserServiceViewer from "../custom/USER_MAP_WORK/viewService";
import StandardDelveryRiderServiceLiveMap from "../serviceProviders/DELIVERY_STANDARD/LiveMap";
import { useParams } from "react-router";

function CheckBookingOrderDelivery() {
  const { user } = useAuth();
  const type = user?.type;

    const { entityId } = useParams<{ entityId: string }>();
  

  
  return (
     <div className="flex-1 p-2">
      {(() => {
        switch (type) {
          case "DELIVERY":
            return <RiderLiveMap />;
            case "delivery-standard":
            return <StandardDelveryRiderServiceLiveMap />;
          default:
            
            return <UserServiceViewer entityId={entityId ??""} />;
        }
      })()}
    </div>
  );
}

export default CheckBookingOrderDelivery;
//  <div className="flex-1 p-2">
//       {(() => {
//         switch (type) {
//           case "DELIVERY":
//             return <RiderLiveMap />;
//             case "delivery-standard":
//             return <StandardDelveryRiderServiceLiveMap />;
//           default:
//             return <UserServiceViewer />;
//         }
//       })()}
//     </div>
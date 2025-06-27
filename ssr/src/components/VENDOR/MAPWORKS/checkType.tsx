import { useCurrentUserProfileId } from "@/components/GLOBAL/PROTECTION/checkBusinessType";
import { useAuth } from "@/middleware/context/authContext";
import { useParams } from "react-router";
import { MainDeliveryZoneCreator } from "./merge/create";
import { RiderZoneSetup } from "@/components/RIDER/riderflowMerge";
// import { VendorProcessFlow } from ".."
// import { MainDeliveryZoneCreator } from "./RiderDeliverySys/create"
// import {RiderZoneSetup} from "./RiderDeliverySys/ForDeliveryService/books/riderflow"
// import { useCurrentUserProfileId } from "@/components/GlobalLogic/checkBusinessType"
// import VendorProcessFlow from "../VendorProcessFlow"
// import MainDeliveryZoneCreator from "../MainDeliveryZoneCreator"

function CheckType() {
  const { user } = useAuth();
  const { serviceId } = useParams<{ serviceId: string }>();
  const profileId = useCurrentUserProfileId();
  const type = user?.type;

  //   const { data, loading, error } = useQuery(GET_PROVIDER, {
  //     variables: { serviceId },
  //   })
  //type of user
  return (
    <>
      {type === "SERVICE" ? (
        <RiderZoneSetup />
      ) : (
           <MainDeliveryZoneCreator serviceId={serviceId ?? profileId ?? ""} />

      )}
    </>
  );
}

export default CheckType;

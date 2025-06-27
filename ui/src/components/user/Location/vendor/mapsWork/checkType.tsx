import { useAuth } from "@/middleware/context/authContext"
import { useParams } from "react-router"
import { VendorProcessFlow } from ".."
import { MainDeliveryZoneCreator } from "./RiderDeliverySys/create"
import {RiderZoneSetup} from "./RiderDeliverySys/ForDeliveryService/books/riderflow"
import { useCurrentUserProfileId } from "@/components/GlobalLogic/checkBusinessType"
// import VendorProcessFlow from "../VendorProcessFlow"
// import MainDeliveryZoneCreator from "../MainDeliveryZoneCreator"

function CheckType() {
    const {user} = useAuth()
    const { serviceId } = useParams<{ serviceId: string }>()
const profileId = useCurrentUserProfileId();
    const  type  = user?.type

//   const { data, loading, error } = useQuery(GET_PROVIDER, {
//     variables: { serviceId },
//   })
    //type of user
  return (
    <>
             {/* <MainDeliveryZoneCreator serviceId={serviceId ?? profileId ?? ""} /> */}

    </>
  )
    
  
}

// {type === "SERVICE" ? (
//         <RiderZoneSetup  serviceId={serviceId ??""}/>
//       ) : (
//         <MainDeliveryZoneCreator serviceId={serviceId ??""} />
//       )}

export default CheckType
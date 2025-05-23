import { useAuth } from "@/middleware/context/authContext"
import { useParams } from "react-router"
import { VendorProcessFlow } from ".."
import { MainDeliveryZoneCreator } from "./RiderDeliverySys/create"
// import VendorProcessFlow from "../VendorProcessFlow"
// import MainDeliveryZoneCreator from "../MainDeliveryZoneCreator"

function CheckType() {
    const {user} = useAuth()
    const { serviceId } = useParams<{ serviceId: string }>()

    const  type  = user?.type

//   const { data, loading, error } = useQuery(GET_PROVIDER, {
//     variables: { serviceId },
//   })
    //type of user
  return (
    <>
      {type === "SERVICE" ? (
        <VendorProcessFlow  serviceId={serviceId ??""}/>
      ) : (
        <MainDeliveryZoneCreator serviceId={serviceId ??""} />
      )}
    </>
  )
    
  
}

export default CheckType
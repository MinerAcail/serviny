import WorksNav from "@/components/custom/nav";
import OrderManagement from "./order-management";
import VendorItemManagement from "./vendor-item-management";
import ProfileVendor from "@/components/custom/nav/vendorProfile";
import AvailabilityPage from "./available";
import NavBar from "../navBar";
import { useParams } from "react-router";
import { EventUpdateForm } from "@/components/serviceProviders/eventBase/event-update-form";
// import OrderManagement from "./order-management"
export function VendorDashboard() {
  return (
    <div className="flex flex-col w-full ">
      <WorksNav />
      <VendorItemManagement />
    </div>
  );
}

export function VendorItems() {
  return (
    <div className="flex flex-col w-full">
      <WorksNav />

      <OrderManagement />
    </div>
  );
}

export function VendorProfile() {
  return (
    <div className="flex flex-col w-full">
      <NavBar />

      <ProfileVendor />
    </div>
  );
}
export function ProviderCheckOut() {
  // const { serviceId } = useParams<{ serviceId: string }>(); // Get ServiceId from URL

  // console.log("Servicefdf ID:", serviceId); // Log the serviceId to the console
  return (
    <div className="flex flex-col  w-full">
      <div className="pb-10">
        <WorksNav />
      </div>

      <AvailabilityPage />
    </div>
  );
}


export function UpdatEvent() {
  // const { serviceId } = useParams<{ serviceId: string }>(); // Get ServiceId from URL

  // console.log("Servicefdf ID:", serviceId); // Log the serviceId to the console
  return (
    <div className="flex flex-col   w-full">
      <div className="pb-20">
        <WorksNav />
      </div>

      <EventUpdateForm />
    </div>
  );
}
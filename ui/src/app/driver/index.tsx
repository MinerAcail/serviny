import WorksNav from "@/components/custom/nav";
import OrderManagement from "./order-management";
import WorkerProfile from "@/components/custom/nav/workersProfile";


export function DriverOrderItems() {
  return (
    <div className="flex flex-col w-full">
      <WorksNav  />

      <OrderManagement />
    </div>
  );
}

export function WorkersProfile() {
  return (
    <div className="flex flex-col w-full ">
      <WorksNav  />

      <WorkerProfile />
    </div>
  );
}
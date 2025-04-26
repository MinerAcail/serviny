import { useEffect, useState } from "react";


import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Overview } from "./overview";
import { Vendors } from "./vendor";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState(() => {
    const storedTab = localStorage.getItem("activeTab");
    return storedTab ? storedTab : "overview";
  });

  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  return (
    <div className="w-full min-h-screen">
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto pb-2">
            <TabsList className="w-full justify-around ">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="vendors">Vendors</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="pt-4">
            <Overview />
          </TabsContent>

          <TabsContent value="vendors" className="pt-4">
            <Vendors />
          </TabsContent>

         
        </Tabs>
      </main>
    </div>
  );
}

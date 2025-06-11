import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import FormBuilder from "./FormBuilder";
import RiderRequests from "@/components/serviceProviders/DELIVERY_ENTERPRISE/riderRequests";
import SubmissionsViewer from "./submissionsViewer";

export default function FormAndRequestTabs() {
  return (
    <div className="w-full  mx-auto p-4">
      <Tabs defaultValue="request" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="request">Request</TabsTrigger>
          <TabsTrigger value="submit">Form submit</TabsTrigger>
          <TabsTrigger value="forms">Form Builder</TabsTrigger>
        </TabsList>

        <TabsContent value="request" className="space-y-4">
          <RiderRequests />
        </TabsContent>

        <TabsContent value="forms" className="space-y-4">
          <FormBuilder />
        </TabsContent>

        <TabsContent value="submit" className="space-y-4">
          <SubmissionsViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
}

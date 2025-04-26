import { ReactNode, useState } from "react";
import { gql, useMutation } from "@apollo/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bike, Megaphone, Package, Send } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Card } from "@/components/ui/card.tsx";

const JOB_REQUEST_MUTATION = gql`
  mutation JobRequest($input: jobRequestInput!) {
    jobRequest(input: $input) {
      id
      type
      name
    }
  }
`;

interface FormData {
  name: string;
  email: string;
  number: string;
  experience: string;
  type: "Driver" | "Dispatch" | "Advertiser" | "";
}

interface JobRequestResponse {
  id: string;
  type: string;
  name: string;
}

interface ApplyNowSectionProps {
  children: ReactNode;
}

const ApplyNowSection = ({ children }: ApplyNowSectionProps) => {
  const [jobRequest, { loading, error }] = useMutation<
    { jobRequest: JobRequestResponse },
    { input: FormData }
  >(JOB_REQUEST_MUTATION);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    number: "",
    type: "",
    experience: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await jobRequest({
        variables: {
          input: {
            ...formData,
            type: formData.type || "Driver", // Default to Driver if not selected
          },
        },
      });

      if (response.data) {
        toast(
          `Application Submitted. We'll get back to you within 24 hours. ${response.data.jobRequest.name}`
        );

        // Reset form
        setFormData({
          name: "",
          email: "",
          number: "",
          type: "",
          experience: "",
        });
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error(
        `An error occurred: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    }
  };
  if (error) {
    console.error("Apollo error:", error);
  }
  return (
    <div className=" ">
      <Dialog>
        <DialogTrigger asChild>
          <Button className="group relative px-8 py-6 text-lg font-semibold overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
            <motion.span
              className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
              initial={false}
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            🚀{children}
            <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">
              →
            </span>
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Join Our Team
            </DialogTitle>
            <DialogDescription>
              Fill out the form below and we'll get back to you within 24 hours.
            </DialogDescription>
          </DialogHeader>

          <Card className="max-h-screen overflow-y-scroll h-full flex flex-col p-4 overscroll-contain">
            <form onSubmit={handleSubmit} className="mt-8 p-1 h- ">
              <div className="gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="John Doe"
                  required
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>

              <div className="">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="you@example.com"
                  required
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="number">Phone Number</Label>
                <Input
                  id="number"
                  type="tel"
                  value={formData.number}
                  onChange={(e) =>
                    setFormData({ ...formData, number: e.target.value })
                  }
                  placeholder="(123) 456-7890"
                  required
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label>Position Interest</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "Driver" | "Dispatch") =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dispatch" className="flex items-center">
                      <div className="flex items-center">
                        <Package className="w-4 h-4 mr-2 text-blue-500" />
                        Dispatch Team
                      </div>
                    </SelectItem>
                    <SelectItem value="Driver" className="flex items-center">
                      <div className="flex items-center">
                        <Bike className="w-4 h-4 mr-2 text-purple-500" />
                        Driver
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="Advertiser"
                      className="flex items-center"
                    >
                      <div className="flex items-center">
                        <Megaphone className="w-4 h-4 mr-2 text-purple-500" />
                        Advertiser
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Relevant Experience</Label>
                <Input
                  id="experience"
                  type="text"
                  value={formData.experience}
                  onChange={(e) =>
                    setFormData({ ...formData, experience: e.target.value })
                  }
                  placeholder="Brief description of your experience"
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-6"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Send className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <>
                    Submit Application
                    <Send className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </Card>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplyNowSection;


import { useRef, useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { gql, useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NavBar from "./navBar";

// Icons
import {
  User,
  KeyRound,
  Camera,
  Calendar,
  ChevronRight,
  Share,
  Mails,
  NotebookTabs,
  MapPin,
  X,
  
} from "lucide-react";
import BackButton from "../back";
import { ThemeSelector } from "@/hooks/theme-selector";

// GraphQL Queries and Mutations
const GET_SERVICE = gql`
  query getService {
    getService {
      id
      dpfile
      name
      number
      email
      profession
      aboutMe
      location
      createdAt
    }
  }
`;

const UPDATE_SERVICE = gql`
  mutation updateService(
    $dpfile: Upload
    $input: UpdateServiceInput!
    $removeProfession: [String]
  ) {
    updateService(
      dpfile: $dpfile
      input: $input
      removeProfession: $removeProfession
    ) {
      id
      dpfile
      name
      number
      email
      profession
      aboutMe
      location
    }
  }
`;

// Types and Schemas
interface Profession {
  value: string;
  label: string;
}

const AVAILABLE_PROFESSIONS: Profession[] = [
  { value: "architect", label: "Architect" },
  { value: "interior_designer", label: "Interior Designer" },
  { value: "contractor", label: "Contractor" },
  { value: "landscaper", label: "Landscaper" },
  { value: "electrician", label: "Electrician" },
  { value: "plumber", label: "Plumber" },
  { value: "carpenter", label: "Carpenter" },
  { value: "painter", label: "Painter" },
];

const profileFormSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Name must be at least 2 characters.",
    })
    .optional(),
  number: z
    .string()
    .regex(/^\d+$/, {
      message: "Please enter a valid number.",
    })
    .optional(),
  email: z.string().email({ message: "Invalid email address." }).optional(),
  profession: z.array(z.string()).optional(),
  aboutMe: z.string().optional(),
  location: z.string().optional(),
});

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    newPassword: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    confirmPassword: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match.",
    path: ["confirmPassword"],
  });

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function ProfileService() {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>([]);
  const [customProfession, setCustomProfession] = useState("");
  const [removedProfessions, setRemovedProfessions] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // GraphQL Hooks
  const { loading: queryLoading, data: serviceData } = useQuery(GET_SERVICE);
  const [updateService, { loading: mutationLoading }] = useMutation(
    UPDATE_SERVICE,
    {
      onCompleted: () => {
        toast("Profile updated successfully.");
        setIsLoading(false);
      },
      onError: (error) => {
        toast("Error updating profile: " + error.message);
        setIsLoading(false);
      },
      refetchQueries: [{ query: GET_SERVICE }],
    }
  );

  // Form Hooks
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      number: "",
      email: "",
      profession: [],
      aboutMe: "",
      location: "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Effects
  useEffect(() => {
    if (serviceData?.getService) {
      const service = serviceData.getService;

      // Update the form with service data
      profileForm.reset({
        name: service.name || "",
        number: service.number || "",
        email: service.email || "",
        profession: service.profession || [],
        aboutMe: service.aboutMe || "",
        location: service.location || "",
      });
      // Reset removed professions when data loads
      setRemovedProfessions([]);
      // Update selected professions state
      setSelectedProfessions(service.profession || []);
    }
  }, [serviceData, profileForm]);

  // Derived values
  const isPageLoading = queryLoading || mutationLoading || isLoading;

  // Helper functions
  const getUserInitials = () => {
    const name = serviceData?.getService?.name || "JD";
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getAvatarSrc = () => {
    if (previewUrl) return previewUrl;
    if (serviceData?.getService?.dpfile) return serviceData.getService.dpfile;
    return "/placeholder.svg?height=128&width=128";
  };

  // Event handlers
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);

      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result as string);
      };
      fileReader.readAsDataURL(file);
    }
  };

  const handleAddProfession = (profession: string) => {
    if (profession.trim() && !selectedProfessions.includes(profession.trim())) {
      const updatedProfessions = [...selectedProfessions, profession.trim()];
      setSelectedProfessions(updatedProfessions);
      profileForm.setValue("profession", updatedProfessions);

      // If we're re-adding a previously removed profession, remove it from removedProfessions
      setRemovedProfessions((prev) =>
        prev.filter((p) => p !== profession.trim())
      );
    }
  };

  // Updated handleRemoveProfession function
  const handleRemoveProfession = (profession: string) => {
    const updatedProfessions = selectedProfessions.filter(
      (p) => p !== profession
    );
    setSelectedProfessions(updatedProfessions);
    profileForm.setValue("profession", updatedProfessions);

    // Add to removed professions list to be sent to the server
    setRemovedProfessions((prev) => [...prev, profession]);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleShare = () => {
    const serviceId = serviceData?.getService?.id;
    const baseUrl = "https://ssr.serviny.com";
    const shareUrl = serviceId
      ? `${baseUrl}/${serviceId}`
      : window.location.href;

    navigator.clipboard.writeText(shareUrl);
    toast("Link copied to clipboard.");
  };

  // Form submission handlers
  const onProfileSubmit = (data: ProfileFormValues) => {
    setIsLoading(true);

    const input = {
      ...(data.name && { name: data.name }),
      ...(data.number && { number: data.number }),
      ...(data.email && { email: data.email }),
      ...(data.profession &&
        data.profession.length > 0 && { profession: data.profession }),
      ...(data.aboutMe && { aboutMe: data.aboutMe }),
      ...(data.location && { location: data.location }),
    };

    updateService({
      variables: {
        dpfile: selectedFile,
        input,
        removeProfession:
          removedProfessions.length > 0 ? removedProfessions : undefined,
      },
    });
  };

  const onPasswordSubmit = (data: PasswordFormValues) => {
    setIsLoading(true);

    // Simulate API call - replace with actual mutation when needed
    setTimeout(() => {
      console.log(data);
      setIsLoading(false);
      toast("Password updated successfully.");
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }, 1000);
  };

  // Component rendering
  const renderUserInfo = () => (
    <Card className="border-none shadow-md sticky top-4">
      <BackButton />
      <CardContent className="pt-6 flex flex-col items-center text-center">
        <div className="relative mb-4">
          <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-lg">
            <AvatarImage src={getAvatarSrc()} alt="Profile picture" />
            <AvatarFallback className="text-2xl sm:text-3xl font-semibold bg-primary/10">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <label htmlFor="profile-picture">
            <Button
              size="icon"
              variant="secondary"
              className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 cursor-pointer"
              type="button"
              onClick={triggerFileInput}
            >
              <Camera className="h-4 w-4" />
            </Button>
            <input
              id="profile-picture"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
          </label>
        </div>

        <div className="space-y-1.5 mb-4">
          <h2 className="text-lg sm:text-xl font-bold">
            {serviceData?.getService?.name || "Loading..."}
          </h2>
          <div className="grid grid-cols-2 gap-3 px-10">
            <div className="flex items-center justify-center text-xs sm:text-sm text-muted-foreground">
              <NotebookTabs className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
              <span className="truncate max-w-[200px]">
                {serviceData?.getService?.number || "Loading..."}
              </span>
            </div>
            <div className="flex items-center justify-center text-xs sm:text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
              <span className="truncate max-w-[200px]">
                {serviceData?.getService?.location || "Loading..."}
              </span>
            </div>
            <div className="flex items-center justify-center text-xs sm:text-sm text-muted-foreground">
              <Mails className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
              <span className="truncate max-w-[200px]">
                {serviceData?.getService?.email || "Loading..."}
              </span>
            </div>
            <div className="flex items-center justify-center text-xs sm:text-sm text-muted-foreground">
              <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
              <span>
                Member since{" "}
                {serviceData?.getService?.createdAt
                  ? new Date(
                      serviceData.getService.createdAt
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Loading..."}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-wrap gap-2 justify-center">
          <Badge variant="outline" className="bg-primary/5">
            Active
          </Badge>
          <Badge
            variant="outline"
            className="gap-1 bg-primary/5 cursor-pointer"
            onClick={handleShare}
          >
            <Share className="h-3 w-3" />
            <span>Share</span>
          </Badge>
            <ThemeSelector />

        </div>
      </CardContent>

      <CardFooter className="flex flex-col px-4 sm:px-6 py-4 border-t">
        <Tabs className="w-full space-y-3">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 h-auto">
            <TabsTrigger
              value="profile"
              className={`flex justify-start px-3 py-2.5 ${
                activeTab === "profile" ? "bg-primary/10" : ""
              }`}
              onClick={() => setActiveTab("profile")}
            >
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger
              value="password"
              className={`flex justify-start px-3 py-2.5 ${
                activeTab === "password" ? "bg-primary/10" : ""
              }`}
              onClick={() => setActiveTab("password")}
            >
              <KeyRound className="mr-2 h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardFooter>
    </Card>
  );

  const renderProfessionSelector = () => (
    <FormItem>
      <FormLabel>Profession</FormLabel>
      <div className="space-y-2">
        <Select onValueChange={handleAddProfession}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a profession" />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_PROFESSIONS.map((profession) => (
              <SelectItem
                key={profession.value}
                value={profession.value}
                disabled={selectedProfessions.includes(profession.value)}
              >
                {profession.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2">
          <Input
            placeholder="Add custom profession"
            value={customProfession}
            onChange={(e) => setCustomProfession(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && customProfession.trim()) {
                e.preventDefault();
                handleAddProfession(customProfession);
                setCustomProfession("");
              }
            }}
          />
          <Button
            type="button"
            onClick={() => {
              if (customProfession.trim()) {
                handleAddProfession(customProfession);
                setCustomProfession("");
              }
            }}
          >
            Add
          </Button>
        </div>

        {selectedProfessions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedProfessions.map((profession) => {
              const professionLabel =
                AVAILABLE_PROFESSIONS.find((p) => p.value === profession)
                  ?.label || profession;
              return (
                <Badge
                  key={profession}
                  variant="secondary"
                  className="pl-2 pr-1 py-1"
                >
                  {professionLabel}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => handleRemoveProfession(profession)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}
          </div>
        )}

        <input
          type="hidden"
          value={selectedProfessions.join(",")}
          {...profileForm.register("profession")}
        />
      </div>
      <FormMessage />
    </FormItem>
  );

  const renderProfileForm = () => (
    <Form {...profileForm}>
      <form
        onSubmit={profileForm.handleSubmit(onProfileSubmit)}
        className="space-y-4"
      >
        <FormField
          control={profileForm.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={profileForm.control}
          name="number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="Enter your phone number"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={profileForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {renderProfessionSelector()}

        <FormField
          control={profileForm.control}
          name="aboutMe"
          render={({ field }) => (
            <FormItem>
              <FormLabel>About Me</FormLabel>
              <FormControl>
                <Textarea placeholder="Tell us about yourself" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={profileForm.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="Enter your location" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button
            className="gap-2 w-[30%] mr-3 sm:w-auto"
            variant="outline"
            onClick={() => {
              // profileForm.reset({
              //   name: "",
              //   number: "",
              //   email: "",
              //   profession: [],
              //   aboutMe: "",
              //   location: "",
              // });
              setSelectedProfessions([]);
              window.history.back();
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button className="w-[70%]" type="submit" disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Profile"}
          </Button>
        </div>
      </form>
    </Form>
  );

  const renderPasswordForm = () => (
    <Form {...passwordForm}>
      <form
        onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
        className="space-y-6"
      >
        <FormField
          control={passwordForm.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...field}
                  className="bg-background"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={passwordForm.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...field}
                    className="bg-background"
                  />
                </FormControl>
                <FormDescription className="text-xs sm:text-sm">
                  Password must be at least 8 characters long.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={passwordForm.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...field}
                    className="bg-background"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button
            className="gap-2 w-full mr-3 sm:w-auto"
            variant="outline"
            onClick={() => {
              passwordForm.reset({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
              });
              window.history.back();
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPageLoading}
            className="gap-2 w-full sm:w-auto"
          >
            {isPageLoading ? (
              <>Updating password...</>
            ) : (
              <>
                <KeyRound className="h-4 w-4" />
                <span>Update Password</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 pb-8">
      <div className="pb-11">
        <NavBar />
      </div>
      <div className="space-y-6">
        {/* Breadcrumb - visible on tablet and larger */}
        <div className="hidden sm:flex items-center text-sm text-muted-foreground py-4">
          <div>Account</div>
          <ChevronRight className="h-4 w-4 mx-1" />
          <span className="font-medium text-foreground">
            {activeTab === "profile"
              ? "Profile Information"
              : "Password & Security"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Sidebar with user info */}
          <div className="md:col-span-1">{renderUserInfo()}</div>

          {/* Main content */}
          <div className="md:col-span-2 lg:col-span-3">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsContent value="profile" className="m-0">
                <Card className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your account details and public profile
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    {queryLoading ? (
                      <div className="flex justify-center py-8">
                        Loading profile data...
                      </div>
                    ) : (
                      renderProfileForm()
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="password" className="m-0">
                <Card className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle>Password & Security</CardTitle>
                    <CardDescription>
                      Ensure your account stays secure with a strong password
                    </CardDescription>
                  </CardHeader>

                  <CardContent>{renderPasswordForm()}</CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

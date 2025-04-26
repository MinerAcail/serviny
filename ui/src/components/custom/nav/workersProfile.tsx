"use client";

import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import {
  User,
  KeyRound,
  Save,
  Camera,
  Mail,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { gql, useQuery, useMutation } from "@apollo/client";
import UserActivityBadge from "./active";

// GraphQL Queries and Mutations
const GET_WORKER = gql`
  query Getworker {
    getWorker {
      id
      name
      number
      type
      dpfile
    }
  }
`;

const UPDATE_WORKER = gql`
  mutation updateWorker($dpfile: Upload, $input: UpdateInput!) {
    updateWorker(dpfile: $dpfile, input: $input) {
      id
      dpfile
      name
      number
      type
    }
  }
`;

// Profile form schema
const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  number: z.string().regex(/^\d+$/, {
    message: "Please enter a valid number.",
  }),
});

// Password form schema
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

export default function WorkerProfile() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // GraphQL Hooks
  const { loading: queryLoading, data: workerData } = useQuery(GET_WORKER);
  const [updateWorker, { loading: mutationLoading }] = useMutation(
    UPDATE_WORKER,
    {
      onCompleted: () => {
        toast("Profile updated successfully.");
        setIsLoading(false);
      },
      onError: (error) => {
        toast("Error updating profile: " + error.message);
        setIsLoading(false);
      },
      refetchQueries: [{ query: GET_WORKER }],
    }
  );

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: workerData?.getWorker?.name || "",
      number: workerData?.getWorker?.number || "",
    },
  });

  // Update form values when worker data is loaded
  useState(() => {
    if (workerData?.getWorker) {
      profileForm.reset({
        name: workerData.getWorker.name || "",
        number: workerData.getWorker.number || "",
      });
    }
  });

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Handle file change for profile picture
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);

      // Create preview URL
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result as string);
      };
      fileReader.readAsDataURL(file);
    }
  };

  // Handle profile form submission
  function onProfileSubmit(data: ProfileFormValues) {
    setIsLoading(true);

    updateWorker({
      variables: {
        dpfile: selectedFile,
        input: {
          name: data.name,
          number: data.number,
          // Include other required fields from your schema
          type: workerData?.getWorker?.type || "default",
        },
      },
    });
  }

  // Handle password form submission
  function onPasswordSubmit(data: PasswordFormValues) {
    setIsLoading(true);

    // Simulate API call - replace with actual mutation when needed
    setTimeout(() => {
      console.log(data);
      setIsLoading(false);
      toast("Password updated, Your password has been updated successfully.");
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }, 1000);
  }

  // Handle loading states
  const isPageLoading = queryLoading || mutationLoading || isLoading;

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    const name = workerData?.getWorker?.name || "John Doe";
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Get avatar image source
  const getAvatarSrc = () => {
    if (previewUrl) return previewUrl;
    if (workerData?.getWorker?.dpfile) return workerData.getWorker.dpfile;
    return "/placeholder.svg?height=128&width=128";
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  return (
    <div className="container pt-16 mx-auto px-4 sm:px-6 pb-8">
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
          <div className="md:col-span-1">
            <Card className="border-none shadow-md sticky top-4">
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
                    {workerData?.getWorker?.name || "Loading..."}
                  </h2>
                  <div className="flex items-center justify-center text-xs sm:text-sm text-muted-foreground">
                    <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                    <span className="truncate max-w-[200px]">
                      {workerData?.getWorker?.number || "Loading..."}
                    </span>
                  </div>
                  <div className="flex items-center justify-center text-xs sm:text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                    <span>Member since 2023</span>
                  </div>
                </div>

                <div className="w-full flex flex-wrap gap-2 justify-center">
                  <Badge className="bg-primary text-primary-foreground font-medium">
                    {workerData?.getWorker?.type || "Loading..."}
                  </Badge>

                  <UserActivityBadge />
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
                      <span>Profile Information</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="password"
                      className={`flex justify-start px-3 py-2.5 ${
                        activeTab === "password" ? "bg-primary/10" : ""
                      }`}
                      onClick={() => setActiveTab("password")}
                    >
                      <KeyRound className="mr-2 h-4 w-4" />
                      <span>Password & Security</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardFooter>
            </Card>
          </div>

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
                      <Form {...profileForm}>
                        <form
                          onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                          className="space-y-6"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={profileForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Display Name</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Your name"
                                      {...field}
                                      className="bg-background"
                                    />
                                  </FormControl>
                                  <FormDescription className="text-xs sm:text-sm">
                                    This is your public display name.
                                  </FormDescription>
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
                                      placeholder="Your phone number"
                                      {...field}
                                      className="bg-background"
                                    />
                                  </FormControl>
                                  <FormDescription className="text-xs sm:text-sm">
                                    We'll never share your contact information
                                    with anyone else.
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="flex justify-end">
                            <Button
                              type="submit"
                              disabled={isPageLoading}
                              className="gap-2 w-full sm:w-auto"
                            >
                              {isPageLoading ? (
                                <>Saving changes...</>
                              ) : (
                                <>
                                  <Save className="h-4 w-4" />
                                  <span>Save Changes</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </Form>
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

                  <CardContent>
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
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

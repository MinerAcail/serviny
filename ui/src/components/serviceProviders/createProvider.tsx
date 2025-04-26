import React, { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, X, Upload, CheckCircle, EyeOff, Eye } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import NavBar from "./navBar";

// GraphQL Mutation
const CREATE_SERVICE = gql`
  mutation CreateService($dpfile: Upload, $input: CreateServiceInput!) {
    createService(dpfile: $dpfile, input: $input) {
      id
      name
      type
      number
      email
      location
      profession
    }
  }
`;

// Types
interface Profession {
  value: string;
  label: string;
}

interface CreateServiceInput {
  name: string;
  number: string;
  email: string;
  location?: string;
  profession?: string[];
  password: string;
}

// Available professions for selection
const availableProfessions: Profession[] = [
  { value: "architect", label: "Architect" },
  { value: "interior_designer", label: "Interior Designer" },
  { value: "contractor", label: "Contractor" },
  { value: "landscaper", label: "Landscaper" },
  { value: "electrician", label: "Electrician" },
  { value: "plumber", label: "Plumber" },
  { value: "carpenter", label: "Carpenter" },
  { value: "painter", label: "Painter" },
];

/**
 * Create Service Provider Component with shadcn/ui components
 */
export const CreateServiceProvider: React.FC = () => {
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      number: "",
      email: "",
      location: "",
      password: "",
      confirmPassword: "",
    },
  });

  const [createService] = useMutation(CREATE_SERVICE);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setProfilePic(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setProfilePic(null);
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
      setPreviewImage(null);
    }
  };

  const handleAddProfession = (profession: string) => {
    if (profession.trim() && !selectedProfessions.includes(profession)) {
      setSelectedProfessions([...selectedProfessions, profession]);
    }
    setInputValue(""); // Clear input after adding
  };

  const handleRemoveProfession = (profession: string) => {
    setSelectedProfessions(selectedProfessions.filter((p) => p !== profession));
  };

  const onSubmit = async (data: {
    name: string;
    number: string;
    email: string;
    location?: string;
    password: string;
    confirmPassword: string;
  }) => {
    // Check if password and confirm password match
    if (data.password !== data.confirmPassword) {
      toast.error("Error", {
        description: "Passwords do not match",
      });
      return;
    }

    setIsLoading(true);

    try {
      const input: CreateServiceInput = {
        name: data.name,
        number: data.number,
        email: data.email,
        location: data.location,
        profession: selectedProfessions,
        password: data.password,
      };

      await createService({
        variables: {
          dpfile: profilePic,
          input,
        },
      });

      // Reset form on success
      reset();
      setSelectedProfessions([]);
      setProfilePic(null);
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
        setPreviewImage(null);
      }

      toast.success("Success!", {
        description: "Service provider profile created successfully.",
      });
    } catch (err) {
      toast.error("Error", {
        description:
          err instanceof Error ? err.message : "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="pb-11">
        <NavBar />
      </div>
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">
            Create Service Provider Profile
          </CardTitle>
          <CardDescription>
            Register as a new service provider with your professional
            information
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            id="service-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className={errors.name ? "text-destructive" : ""}
                >
                  Full Name / Business Name
                </Label>
                <Input
                  id="name"
                  placeholder="Enter your name or business name"
                  {...register("name", { required: "Name is required" })}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className={errors.email ? "text-destructive" : ""}
                >
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@example.com"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="number"
                  className={errors.number ? "text-destructive" : ""}
                >
                  Phone Number
                </Label>
                <Input
                  id="number"
                  placeholder="Enter your phone number"
                  {...register("number", {
                    required: "Phone number is required",
                    pattern: {
                      value: /^[0-9+ -]+$/,
                      message: "Invalid phone number format",
                    },
                  })}
                  className={errors.number ? "border-destructive" : ""}
                />
                {errors.number && (
                  <p className="text-sm text-destructive">
                    {errors.number.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="location"
                  className={errors.location ? "text-destructive" : ""}
                >
                  Location / Service Area
                </Label>
                <Input
                  id="location"
                  placeholder="E.g., New York City, NY"
                  {...register("location")}
                  className={errors.location ? "border-destructive" : ""}
                />
                {errors.location && (
                  <p className="text-sm text-destructive">
                    {errors.location.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Professions / Services Offered</Label>

                {/* Select Dropdown */}
                <Select onValueChange={handleAddProfession}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a profession" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProfessions.map((profession) => (
                      <SelectItem
                        key={profession.value}
                        value={profession.value}
                        disabled={selectedProfessions.includes(
                          profession.value
                        )}
                      >
                        {profession.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Manual Input for Custom Professions */}
                <Input
                  type="text"
                  placeholder="Type a profession and press Enter"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddProfession(inputValue);
                    }
                  }}
                />

                {/* Display Selected Professions */}
                {selectedProfessions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedProfessions.map((profession) => {
                      const professionLabel =
                        availableProfessions.find((p) => p.value === profession)
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
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Profile Picture</Label>
                  <div
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() =>
                      document.getElementById("profile-picture")?.click()
                    }
                  >
                    <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                    <p className="text-sm font-medium">
                      Drag profile picture here or click to browse
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Supported formats: JPG, PNG, WebP (Max 5MB)
                    </p>
                    <Input
                      id="profile-picture"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>

                {previewImage && (
                  <div className="space-y-2">
                    <Label>Profile Picture Preview</Label>
                    <div className="relative w-32 h-32 mx-auto rounded-full overflow-hidden border">
                      <img
                        src={previewImage}
                        alt="Profile Preview"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 relative">
                <Label
                  htmlFor="password"
                  className={errors.password ? "text-destructive" : ""}
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a secure password"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 8,
                        message: "Password must be at least 8 characters",
                      },
                    })}
                    className={errors.password ? "border-destructive" : ""}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 relative">
                <Label
                  htmlFor="confirmPassword"
                  className={errors.confirmPassword ? "text-destructive" : ""}
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    {...register("confirmPassword", {
                      required: "Please confirm your password",
                      validate: (value, formValues) =>
                        value === formValues.password ||
                        "Passwords do not match",
                    })}
                    className={
                      errors.confirmPassword ? "border-destructive" : ""
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              reset();
              setSelectedProfessions([]);
              setProfilePic(null);
              if (previewImage) {
                URL.revokeObjectURL(previewImage);
                setPreviewImage(null);
              }
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="service-form"
            disabled={isLoading}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Register
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

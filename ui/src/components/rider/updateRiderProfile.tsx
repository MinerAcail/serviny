// UpdateRiderProfile.tsx
import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { User, KeyRound, MapPin, Phone, Mail, FileText, Save, X, Eye, EyeOff, Upload, ChevronDown } from 'lucide-react';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { gql } from '@apollo/client';

// Updated GraphQL mutation to match backend resolver
export const UPDATE_RIDER_PROFILE = gql`
  mutation UpdateRider($input: RiderUpateInput!, $idCardfiles: [Upload!]) {
    updateRider(input: $input, idCardfiles: $idCardfiles) {
      id
      name
      email
      number
      type
      state
      availability
      dpfile
      idCard
      experience
      createdAt
      updatedAt
    }
  }
`;

// Experience options
interface ExperienceOption {
  value: string;
  label: string;
}

const experienceOptions: ExperienceOption[] = [
  { value: "0-1", label: "0-1 years" },
  { value: "1-2", label: "1-2 years" },
  { value: "2-5", label: "2-5 years" },
  { value: "5+", label: "5+ years" },
];

// TypeScript types
export interface RiderUpateInput {
  name?: string;
  email?: string;
  number?: string;
  type?: string;
  state?: string;
  password?: string;
  availability?: boolean;
  dpfile?: File;
  experience?: string;
}

export interface Rider {
  id: string;
  name?: string;
  email: string;
  number: string;
  type?: string;
  state?: string;
  availability?: boolean;
  dpfile?: string;
  idCard?: string[];
  experience?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateRiderProfileProps {
  initialData?: Partial<Rider>;
  onSuccess?: () => void;
}

// Updated validation schemas - all fields are optional
const profileSchema = z.object({
  name: z.string().optional().or(z.literal('')),
  number: z.string().optional().or(z.literal('')),
  email: z.string().optional().or(z.literal('')).refine((val) => {
    if (!val || val === '') return true;
    return z.string().email().safeParse(val).success;
  }, 'Invalid email address'),
  experience: z.string().optional().or(z.literal('')),
});

const passwordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const UpdateRiderProfile: React.FC<UpdateRiderProfileProps> = ({ 
  initialData, 
  onSuccess 
}) => {
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // File upload state
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [idCards, setIdCards] = useState<File[]>([]);
  const [idCardPreviews, setIdCardPreviews] = useState<string[]>([]);

  // Single Apollo mutation for both profile and password updates
  const [updateRider] = useMutation(UPDATE_RIDER_PROFILE, {
    onCompleted: (data) => {
      toast.success('Profile updated successfully!');
      setIsProfileLoading(false);
      setIsPasswordLoading(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update profile');
      setIsProfileLoading(false);
      setIsPasswordLoading(false);
    },
  });

  // Form setup
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialData?.name || '',
      number: initialData?.number || '',
      email: initialData?.email || '',
      experience: initialData?.experience || '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
      idCardPreviews.forEach(preview => {
        URL.revokeObjectURL(preview);
      });
    };
  }, [previewImage, idCardPreviews]);

  // Handle profile picture upload with better error handling
  const handleProfilePicChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (event.target.files && event.target.files[0]) {
        const file = event.target.files[0];

        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast.error("Invalid file type", {
            description: "Please select an image file (JPG, PNG, WebP).",
          });
          return;
        }

        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          toast.error("File too large", {
            description: "Image must be less than 5MB in size",
          });
          return;
        }

        // Clean up previous preview
        if (previewImage) {
          URL.revokeObjectURL(previewImage);
        }

        setProfilePic(file);

        // Generate preview URL
        const objectUrl = URL.createObjectURL(file);
        setPreviewImage(objectUrl);

        toast.success("Profile picture uploaded", {
          description: "Image ready for submission.",
        });
      }
    } catch (error) {
      console.error("Error handling profile picture:", error);
      toast.error("Upload failed", {
        description: "Failed to process profile picture. Please try again.",
      });
    }
  };

  // Handle ID card uploads with better error handling
  const handleIdCardChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (event.target.files && event.target.files.length > 0) {
        const newFiles = Array.from(event.target.files);

        // Validate file types
        const invalidFiles = newFiles.filter(
          (file) =>
            !file.type.startsWith("image/") && file.type !== "application/pdf"
        );

        if (invalidFiles.length > 0) {
          toast.error("Invalid file types", {
            description:
              "Please select only image files (JPG, PNG) or PDF documents.",
          });
          return;
        }

        // Check file sizes
        const largeFiles = newFiles.filter(
          (file) => file.size > 5 * 1024 * 1024
        );
        if (largeFiles.length > 0) {
          toast.error("Files too large", {
            description: "ID card files must be less than 5MB in size each",
          });
          return;
        }

        // Add to existing ID cards
        setIdCards((prev) => [...prev, ...newFiles]);

        // Generate previews for image files only
        const newPreviews = newFiles
          .filter((file) => file.type.startsWith("image/"))
          .map((file) => URL.createObjectURL(file));
        setIdCardPreviews((prev) => [...prev, ...newPreviews]);

        toast.success(`${newFiles.length} ID document(s) uploaded`, {
          description: "Documents ready for submission.",
        });
      }
    } catch (error) {
      console.error("Error handling ID cards:", error);
      toast.error("Upload failed", {
        description: "Failed to process ID documents. Please try again.",
      });
    }
  };

  // Remove a specific ID card
  const removeIdCard = (index: number) => {
    try {
      setIdCards((prev) => prev.filter((_, i) => i !== index));

      // Revoke the object URL to avoid memory leaks
      if (idCardPreviews[index]) {
        URL.revokeObjectURL(idCardPreviews[index]);
      }
      setIdCardPreviews((prev) => prev.filter((_, i) => i !== index));

      toast.success("Document removed", {
        description: "ID document has been removed from upload queue.",
      });
    } catch (error) {
      console.error("Error removing ID card:", error);
      toast.error("Remove failed", {
        description: "Failed to remove document. Please try again.",
      });
    }
  };

  // Remove profile picture
  const handleRemoveProfilePic = () => {
    try {
      setProfilePic(null);
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
        setPreviewImage(null);
      }

      toast.success("Profile picture removed", {
        description: "You can upload a new profile picture if needed.",
      });
    } catch (error) {
      console.error("Error removing profile picture:", error);
      toast.error("Remove failed", {
        description: "Failed to remove profile picture. Please try again.",
      });
    }
  };

  // Profile form submission - only send non-empty values
  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsProfileLoading(true);
    
    try {
      // Only include non-empty values in the input
      const input: RiderUpateInput = {};
      
      if (data.name && data.name.trim() !== '') {
        input.name = data.name.trim();
      }
      
      if (data.email && data.email.trim() !== '') {
        input.email = data.email.trim();
      }
      
      if (data.number && data.number.trim() !== '') {
        input.number = data.number.trim();
      }
      
      if (data.experience && data.experience.trim() !== '') {
        input.experience = data.experience;
      }
      
      if (profilePic) {
        input.dpfile = profilePic;
      }

      // Check if there's anything to update
      if (Object.keys(input).length === 0 && idCards.length === 0) {
        toast.error("No changes to save", {
          description: "Please make at least one change before saving.",
        });
        setIsProfileLoading(false);
        return;
      }

      await updateRider({
        variables: { 
          input,
          idCardfiles: idCards.length > 0 ? idCards : undefined
        },
      });
    } catch (error) {
      console.error('Profile update error:', error);
    }
  };

  // Password form submission
  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsPasswordLoading(true);
    
    try {
      const input: RiderUpateInput = {
        password: data.newPassword,
      };

      await updateRider({
        variables: { input },
      });
      
      // Reset password form on success
      passwordForm.reset();
    } catch (error) {
      console.error('Password update error:', error);
    }
  };

  const renderProfileTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Personal Information
        </CardTitle>
        <CardDescription>
          Update your personal details and documents. All fields are optional - you can update just the information you want to change.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...profileForm}>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
            {/* Profile Picture Section */}
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
              <Avatar className="h-16 w-16">
                <AvatarImage src={previewImage || initialData?.dpfile} alt="Profile" />
                <AvatarFallback>
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">Profile Picture</p>
                <p className="text-sm text-muted-foreground">
                  Update your profile picture (optional)
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  type="button"
                  onClick={() => document.getElementById('profile-pic')?.click()}
                >
                  Upload
                </Button>
                {(profilePic || previewImage) && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    type="button"
                    onClick={handleRemoveProfilePic}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <Input
                id="profile-pic"
                type="file"
                accept="image/*"
                onChange={handleProfilePicChange}
                className="hidden"
              />
            </div>

            {/* ID Cards Section */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                ID Card Documents (Optional)
              </Label>
              <p className="text-sm text-gray-500">
                Upload your government-issued ID cards or driver's license (front and back)
              </p>

              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors border-gray-300"
                onClick={() => document.getElementById("id-cards")?.click()}
              >
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-medium">Upload ID Documents</p>
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: JPG, PNG, PDF (Max 5MB each)
                </p>
                <Input
                  id="id-cards"
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  onChange={handleIdCardChange}
                  className="hidden"
                />
              </div>

              {/* ID Card previews */}
              {(idCardPreviews.length > 0 || idCards.length > 0) && (
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">
                    Uploaded Documents ({idCards.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {idCardPreviews.map((preview, index) => (
                      <div
                        key={index}
                        className="relative rounded-lg overflow-hidden border border-gray-200"
                      >
                        <img
                          src={preview}
                          alt={`ID Card ${index + 1}`}
                          className="w-full h-32 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeIdCard(index)}
                          className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md hover:bg-red-50"
                        >
                          <X size={16} className="text-red-500" />
                        </button>
                        <div className="bg-gray-100 p-1 text-xs text-center">
                          ID Document {index + 1}
                        </div>
                      </div>
                    ))}
                    {/* Show non-image files */}
                    {idCards
                      .slice(idCardPreviews.length)
                      .map((file, index) => (
                        <div
                          key={`file-${index}`}
                          className="relative rounded-lg border border-gray-200 p-4"
                        >
                          <div className="flex flex-col items-center justify-center h-24">
                            <FileText className="h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-xs text-center truncate w-full">
                              {file.name}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeIdCard(idCardPreviews.length + index)}
                            className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md hover:bg-red-50"
                          >
                            <X size={16} className="text-red-500" />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name <span className="text-muted-foreground">(Optional)</span></FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          placeholder="Enter your full name" 
                          className="pl-10"
                          {...field} 
                        />
                      </div>
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
                    <FormLabel>Email Address <span className="text-muted-foreground">(Optional)</span></FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                          type="email" 
                          placeholder="Enter your email" 
                          className="pl-10"
                          {...field} 
                        />
                      </div>
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
                    <FormLabel>Phone Number <span className="text-muted-foreground">(Optional)</span></FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="tel"
                          placeholder="Enter your phone number"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={profileForm.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience Level <span className="text-muted-foreground">(Optional)</span></FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your experience level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                       
                        {experienceOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose your riding experience level or leave unselected
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                disabled={isProfileLoading}
                type="button"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" disabled={isProfileLoading}>
                {isProfileLoading ? (
                  "Updating..."
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Profile
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );

  const renderPasswordTab = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          Change Password
        </CardTitle>
        <CardDescription>
          Update your password to keep your account secure
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          className="pr-10"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Password must be at least 8 characters long
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
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          className="pr-10"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Password Requirements:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• At least 8 characters long</li>
                <li>• Include uppercase and lowercase letters</li>
                <li>• Include numbers and special characters</li>
                <li>• Avoid common passwords</li>
              </ul>
            </div>

            <Separator />

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => passwordForm.reset()}
                disabled={isPasswordLoading}
                type="button"
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
              <Button type="submit" disabled={isPasswordLoading}>
                {isPasswordLoading ? (
                  "Updating..."
                ) : (
                  <>
                    <KeyRound className="h-4 w-4 mr-2" />
                    Update Password
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="password" className="flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Password
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {renderProfileTab()}
        </TabsContent>

        <TabsContent value="password" className="space-y-6">
          {renderPasswordTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UpdateRiderProfile;
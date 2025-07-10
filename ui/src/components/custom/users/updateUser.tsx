// UpdateUserProfile.tsx
import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { User, KeyRound, Phone, Mail, Save, X, Eye, EyeOff, MessageCircle, PhoneCall } from 'lucide-react';

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { gql } from '@apollo/client';

// GraphQL mutation for updating user
export const UPDATE_USER = gql`
  mutation UpdateUser($input: inputUpdateUser!) {
    updateUser(input: $input) {
      id
      name
      email
      number
      numberType
      createdAt
      updatedAt
    }
  }
`;

// TypeScript types
export interface InputUpdateUser {
  name?: string;
  email?: string;
  number?: string;
  numberType?: PhoneType;
  password?: string;
}

export enum PhoneType {
  WHATSAPP = "WHATSAPP",
  PHONE = "PHONE",
  BOTH = "BOTH"
}

export interface User {
  id: string;
  name: string;
  email?: string;
  number: string;
  numberType: PhoneType;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserProfileProps {
  initialData?: Partial<User>;
  onSuccess?: () => void;
}

// Validation schemas
const profileSchema = z.object({
  name: z.string().max(100, 'Name must be less than 100 characters').optional(),
  number: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be less than 15 digits')
    .optional()
    .or(z.literal('')), // allow empty string
  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')), // allow empty string
  numberType: z.nativeEnum(PhoneType, {
    errorMap: () => ({ message: 'Please select a valid phone type' }),
  }).optional(),
}).refine(
  (data) => data.name || data.email || data.number,
  {
    message: 'At least one of name, email, or number must be provided',
    path: ['name'], // Show error under "name" field
  }
);


const passwordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const UpdateUserProfile: React.FC<UpdateUserProfileProps> = ({ 
  initialData, 
  onSuccess 
}) => {
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Apollo mutation for updating user
  const [updateUser] = useMutation(UPDATE_USER, {
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
      numberType: initialData?.numberType || PhoneType.PHONE,
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Profile form submission
  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsProfileLoading(true);
    
    try {
     const input: InputUpdateUser = {
  name: data.name?.trim() || undefined,
  email: data.email?.trim() || undefined,
  number: data.number?.trim() || undefined,
  numberType: data.numberType || undefined,
};


      await updateUser({
        variables: { input },
      });
    } catch (error) {
      console.error('Profile update error:', error);
    }
  };

  // Password form submission
  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsPasswordLoading(true);
    
    try {
      const input: InputUpdateUser = {
        password: data.newPassword,
      };

      await updateUser({
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
          Update your personal details and contact information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...profileForm}>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
            {/* Profile Picture Section */}
            <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
              <Avatar className="h-16 w-16">
                <AvatarImage src="" alt="Profile" />
                <AvatarFallback>
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">Profile Picture</p>
                <p className="text-sm text-muted-foreground">
                  Coming soon - profile picture uploads
                </p>
              </div>
            </div>

            <Separator />

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
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
                    <FormLabel>Email Address (Optional)</FormLabel>
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
                    <FormDescription>
                      We'll use this for important account notifications
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
                    <FormDescription>
                      Your primary contact number
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={profileForm.control}
                name="numberType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select phone type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={PhoneType.PHONE}>
                          <div className="flex items-center gap-2">
                            <PhoneCall className="h-4 w-4" />
                            Phone Only
                          </div>
                        </SelectItem>
                        <SelectItem value={PhoneType.WHATSAPP}>
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" />
                            WhatsApp Only
                          </div>
                        </SelectItem>
                        <SelectItem value={PhoneType.BOTH}>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Both Phone & WhatsApp
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How can we reach you on this number?
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
                <li>• Include at least one number</li>
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
    <div className="max-w-4xl mx-auto px-6 pt-14 space-y-6">
     

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

export default UpdateUserProfile;
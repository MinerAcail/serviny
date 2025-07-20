"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  // DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Copy, User, Sparkles, NotepadText } from "lucide-react";
import { toast } from "sonner";
import { DeliveryServiceSystem } from "@/components/serviceProviders/APPOINTMENT/DeliveryServiceBooking/DeliveryServiceSystem";
import { useAuth } from "@/middleware/context/authContext";
import { gql, useMutation } from "@apollo/client";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CREATE_USER = gql`
    mutation createUser($input: inputUser!,$isService:Boolean) {
    createUser(input: $input,isService:$isService) {
      id
      name
      number
      type
      numberType
      email
    }
  }
`;

interface FormErrors {
  name: string;
  phone: string;
  email: string;
  numberType: string;
}

export default function AddUserDialog() {
  const { user } = useAuth();
  const serviceId = user?.id;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [numberType, setNumberType] = useState("");
  const [autoGenerateEmail, setAutoGenerateEmail] = useState(false);
  const [generatedId, setGeneratedId] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [userDataId, setUserDataId] = useState("");
  const [accordionValue, setAccordionValue] = useState<string>("form-fields");
  const [errors, setErrors] = useState<FormErrors>({
    name: "",
    phone: "",
    email: "",
    numberType: "",
  });
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate a random 6-character ID
  const generateId = () => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  };

  // Generate user link using user information
  const generateUserLink = (userId: string, userName: string) => {
    const cleanName = userName.toLowerCase().replace(/\s+/g, "-");
    return `https://winnemart.com/user/${userId}/${cleanName}`;
  };
  
  // Generate email from name
  const generateEmailFromName = (userName: string) => {
    const cleanName = userName
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9]/g, "");
    const randomSuffix = Math.floor(Math.random() * 1000);
    return `${cleanName}${randomSuffix}@winnemart.com`;
  };

  // Handle auto-generate email checkbox
  const handleAutoGenerateEmailChange = (checked: boolean) => {
    setAutoGenerateEmail(checked);
    if (checked && name.trim()) {
      setEmail(generateEmailFromName(name));
    } else if (!checked) {
      setEmail("");
    }
  };

  // Update email when name changes and auto-generate is enabled
  const handleNameChange = (newName: string) => {
    setName(newName);
    if (autoGenerateEmail && newName.trim()) {
      setEmail(generateEmailFromName(newName));
    }
  };

  const [createUser] = useMutation(CREATE_USER, {
    onCompleted: (data) => {
      console.log("User created successfully:", data);

      // Store the user data ID returned from the database
      const dbUserDataId = data.createUser.id;
      setUserDataId(dbUserDataId);

      // Generate user link using the database user ID
      const userLink = generateUserLink(dbUserDataId, name);
      setGeneratedUrl(userLink);

      // Open the accordion to show generated details
      setAccordionValue("generated-details");

      toast.success("User added successfully!", {
        description: `${name} has been added to the system.`,
      });

      setIsSubmitting(false);
    },
    onError: (error) => {
      console.error("Error creating user:", error);
      toast.error("Failed to create user", {
        description: error.message || "Please try again.",
      });
      setIsSubmitting(false);
    },
  });

  // Validate form fields
  const validateForm = () => {
    const newErrors: FormErrors = {
      name: "",
      phone: "",
      email: "",
      numberType: "",
    };
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
      isValid = false;
    } else if (!/^\+?[\d\s\-()]+$/.test(phone.trim())) {
      newErrors.phone = "Please enter a valid phone number";
      isValid = false;
    }

    if (!numberType) {
      newErrors.numberType = "Number type is required";
      isValid = false;
    }

    if (!autoGenerateEmail && !email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!autoGenerateEmail && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle save and generate button click
  const handleSaveAndGenerate = async () => {
    if (validateForm()) {
      setIsSubmitting(true);
      // Keep form accordion open during generation
      setAccordionValue("form-fields");

      // Generate unique ID and use it as password
      const uniqueId = generateId();
      const password = uniqueId; // Use the same ID as password
      
      setGeneratedId(uniqueId);
      setGeneratedPassword(password);

      // Use auto-generated email if enabled, otherwise use manual email
      const finalEmail = autoGenerateEmail ? generateEmailFromName(name) : email;

      try {
        await createUser({
          variables: {
            input: {
              name: name.trim(),
              number: phone.trim(),
              email: finalEmail,
              password: password,
              numberType: numberType,
            },
            isService:true
          },
        });
      } catch (error) {
        console.error("Mutation error:", error);
      }
    }
  };

  // Reset form function
  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setNumberType("");
    setAutoGenerateEmail(false);
    setGeneratedId("");
    setGeneratedPassword("");
    setGeneratedUrl("");
    setUserDataId("");
    setAccordionValue("form-fields");
    setErrors({ name: "", phone: "", email: "", numberType: "" });
  };

  // Handle close dialog
  const handleCloseDialog = () => {
    resetForm();
    setOpen(false);
  };

  // Handle form submission (now just closes dialog after successful creation)
  const handleSubmit = () => {
    if (userDataId) {
      // Reset to form accordion before closing dialog
      setAccordionValue("form-fields");
      toast.success("User setup complete!", {
        description: "You can now use the generated credentials.",
      });
      handleCloseDialog();
    } else {
      toast.info("Please save user first", {
        description: "Click 'Save and Generate' to create the user.",
      });
    }
  };

  // Copy to clipboard function
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!", { description: `${type} copied to clipboard.` });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2">
            <User className="h-4 w-4" />
            Add User
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Add New User
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Form Fields Accordion */}
            <Accordion
              type="single"
              collapsible
              value={accordionValue}
              onValueChange={setAccordionValue}
              className="w-full"
            >
              <AccordionItem value="form-fields">
                <AccordionTrigger className="text-sm font-medium">
                  User Information
                  {(name || phone || email) && (
                    <div className="ml-2 h-2 w-2 bg-blue-500 rounded-full" />
                  )}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">User's Name</Label>
                      <Input
                        id="name"
                        placeholder="Enter full name"
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className={errors.name ? "border-red-500" : ""}
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500">{errors.name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        placeholder="Enter phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={errors.phone ? "border-red-500" : ""}
                      />
                      {errors.phone && (
                        <p className="text-sm text-red-500">{errors.phone}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="numberType">Number Type</Label>
                      <Select value={numberType} onValueChange={setNumberType}>
                        <SelectTrigger
                          className={errors.numberType ? "border-red-500" : ""}
                        >
                          <SelectValue placeholder="Select number type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WHATSAPP">WHATSAPP</SelectItem>
                          <SelectItem value="PHONE">PHONE</SelectItem>
                          <SelectItem value="BOTH">BOTH</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.numberType && (
                        <p className="text-sm text-red-500">{errors.numberType}</p>
                      )}
                    </div>

                    {/* Email Section */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="autoGenerateEmail"
                          checked={autoGenerateEmail}
                          onCheckedChange={handleAutoGenerateEmailChange}
                        />
                        <Label htmlFor="autoGenerateEmail">
                          Auto-generate email from name
                        </Label>
                      </div>
                      
                      {!autoGenerateEmail && (
                        <>
                          <Label htmlFor="email">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="Enter email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={errors.email ? "border-red-500" : ""}
                          />
                          {errors.email && (
                            <p className="text-sm text-red-500">{errors.email}</p>
                          )}
                        </>
                      )}
                      
                      {autoGenerateEmail && email && (
                        <div className="p-2 bg-gray-50 rounded border">
                          <p className="text-sm text-gray-600">Generated email: {email}</p>
                        </div>
                      )}
                    </div>

                    {/* Generate Button */}
                    <div className="flex justify-center gap-2 pt-4">
                      <Button
                        onClick={handleSaveAndGenerate}
                        variant="outline"
                        className="gap-2 bg-transparent"
                        disabled={isSubmitting}
                      >
                        <Sparkles className="h-4 w-4" />
                        {isSubmitting ? "Generating..." : "Save and Generate"}
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Generated Information - Using Accordion */}
            {(generatedId || generatedUrl || userDataId) && (
              <Accordion
                type="single"
                collapsible
                value={accordionValue}
                onValueChange={setAccordionValue}
                className="w-full"
              >
                <AccordionItem value="generated-details">
                  <AccordionTrigger className="text-sm font-medium">
                    Generated Details
                    {userDataId && (
                      <div className="ml-2 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    )}
                  </AccordionTrigger>
                  <AccordionContent>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="space-y-4">
                          {generatedId && (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Generated ID/Password</Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  value={generatedId}
                                  readOnly
                                  className="font-mono"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    copyToClipboard(generatedId, "ID/Password")
                                  }
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}

                          {generatedUrl && (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">User Link</Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  value={generatedUrl}
                                  readOnly
                                  className="font-mono text-sm"
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    copyToClipboard(generatedUrl, "User link")
                                  }
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {userDataId && (
                            <Button
                              onClick={() => setDialogOpen(true)}
                              variant="secondary"
                              className="gap-2 rounded-full bg-secondary hover:bg-secondary/90 w-full"
                            >
                              <NotepadText className="h-4 w-4" />
                              Book Me
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!userDataId}
              className={
                !userDataId
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }
            >
              <User className="h-4 w-4 mr-2" />
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DeliveryServiceSystem
        isDialogOpenMain={isDialogOpen}
        setDialogOpenMain={setDialogOpen}
        serviceId={serviceId}
        isService={true}
        updateTemp={true}
        userDataId={userDataId}
      />
    </>
  );
}
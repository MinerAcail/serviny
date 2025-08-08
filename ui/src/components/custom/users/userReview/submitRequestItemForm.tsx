import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@apollo/client";
import { gql } from "@apollo/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ImageUpload } from "./image-upload";
import { Plus, Loader2, Link, ImageIcon } from "lucide-react";
import { toast } from "sonner";

// GraphQL mutation for submitting a new item
const SUBMIT_ITEM = gql`
  mutation RequestItem($input: RequestInput!, $serviceId: String!) {
    requestItem(input: $input, serviceId: $serviceId) {
      id
      name
      categories
      description
      imageUrls
      webLink
      state
      createdAt
    }
  }
`;

// Fixed interface to match Go struct
interface RequestInput {
  name?: string;
  price?: string;
  category?: string;
  description?: string;
  quantity?: number;
  itemType?: string;
  webLink?: {
    name?: string;
    link?: string;
  };
  images?: File[];
}

// Data maps for select options
const CATEGORIES = new Map([
  ["electronics", "Electronics"],
  ["clothing", "Clothing"],
  ["books", "Books"],
  ["home", "Home & Garden"],
  ["sports", "Sports & Recreation"],
  ["automotive", "Automotive"],
  ["health", "Health & Beauty"],
  ["toys", "Toys & Games"],
  ["other", "Other"]
]);

const ECOMMERCE_PLATFORMS = new Map([
  ["Amazon", "Amazon"],
  ["eBay", "eBay"],
  ["AliExpress", "AliExpress"],
  ["Alibaba", "Alibaba"],
  ["Walmart", "Walmart"],
  ["Target", "Target"],
  ["Best Buy", "Best Buy"],
  ["Etsy", "Etsy"],
  ["Shopify", "Shopify"],
  ["Temu", "Temu"],
  ["Wish", "Wish"],
  ["Other", "Other"]
]);

// Updated form schema to be more flexible
const formSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Item name must be at least 2 characters." }),
  category: z.string().min(1, { message: "Please select a category." }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters." }),
  price: z.string().optional(),
  quantity: z.number().min(1).optional(),
  itemType: z.string().optional(),
  webLink: z.string().url().optional().or(z.literal("")),
  ecommercePlatform: z.string().optional(),
});

// Separate trigger button component
export function SubmitItemTrigger() {
  return (
    <Button className="flex items-center gap-2">
      <Plus className="h-4 w-4" />
      Submit New Item
    </Button>
  );
}

// Main dialog component
interface SubmitItemDialogProps {
  children: React.ReactNode;
  serviceId: string;
}

export function SubmitRequestItemDialog({ children, serviceId }: SubmitItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [submissionMethod, setSubmissionMethod] = useState<"images" | "link" | "both">("images");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      price: "",
      quantity: 1,
      itemType: "",
      webLink: "",
      ecommercePlatform: "",
    },
  });

  // Set up GraphQL mutation
  const [submitItemMutation, { loading: isSubmitting }] = useMutation(
    SUBMIT_ITEM,
    {
      onCompleted: (data) => {
        form.reset();
        setImageFiles([]);
        setOpen(false);
        toast.success("Success! Your item has been submitted successfully.");
        
        // Fixed navigation with proper error handling
        if (data?.requestItem?.id) {
          try {
            // Use proper URL construction
            const url = `/dd/${encodeURIComponent(serviceId)}/${encodeURIComponent(data.requestItem.id)}?request=true`;
            window.location.href = url;
          } catch (error) {
            console.error("Navigation error:", error);
            toast.error("Item submitted but navigation failed. Please refresh the page.");
          }
        }
      },
      onError: (error) => {
        console.error("Error submitting item:", error);
        toast.error("Submission Failed: " + error.message);
      },
    }
  );

  const handleImageChange = (files: File[]) => {
    setImageFiles(files);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Updated validation logic - more flexible
    const hasImages = imageFiles.length > 0;
    const hasWebLink = values.webLink && values.webLink.trim() !== "";

    // Validate based on submission method
    if (submissionMethod === "images" && !hasImages) {
      toast.error("Please upload at least one image.");
      return;
    }

    if (submissionMethod === "link" && !hasWebLink) {
      toast.error("Please provide a web link.");
      return;
    }

    if (submissionMethod === "both" && !hasImages && !hasWebLink) {
      toast.error("Please provide either images or a web link (or both).");
      return;
    }

    try {
      // Prepare input variables
      const inputVariables: RequestInput = {
        name: values.name,
        category: values.category,
        description: values.description,
        price: values.price || undefined,
        quantity: values.quantity || 1,
        itemType: values.itemType || undefined,
      };

      // Add images if provided
      if (hasImages) {
        inputVariables.images = imageFiles;
      }

      // Add web link if provided
      if (hasWebLink) {
        inputVariables.webLink = {
          link: values.webLink,
          name: values.ecommercePlatform || undefined,
        };
      }

      await submitItemMutation({
        variables: {
          input: inputVariables,
          serviceId: serviceId,
        },
      });
    } catch (error) {
      console.error("Submission error:", error);
      // Error handling is already done in the mutation's onError callback
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-white border-none rounded-3xl shadow-2xl overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 bg-white">
          <DialogTitle className="text-xl font-semibold text-black text-center">Submit New Item</DialogTitle>
          <DialogDescription className="text-gray-500 text-center text-sm mt-1">
            Fill out the form below to submit a new item for review.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] px-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pb-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-black font-medium text-sm">Item Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter item name"
                        {...field}
                        className="w-full bg-gray-50 border-none rounded-xl h-12 px-4 text-black placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-black/20 transition-all duration-200"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500 text-xs" />
                  </FormItem>
                )}
              />

              {/* Updated Submission Method Selection */}
              <div>
                <FormLabel className="text-black font-medium text-sm">How would you like to specify the item?</FormLabel>
                <Tabs 
                  value={submissionMethod} 
                  onValueChange={(value) => setSubmissionMethod(value as "images" | "link" | "both")}
                  className="mt-3"
                >
                  <TabsList className="grid w-full grid-cols-3 bg-gray-100 rounded-xl p-1 h-auto">
                    <TabsTrigger 
                      value="images" 
                      className="flex items-center gap-2 rounded-lg py-2.5 px-3 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all duration-200"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      Images Only
                    </TabsTrigger>
                    <TabsTrigger 
                      value="link" 
                      className="flex items-center gap-2 rounded-lg py-2.5 px-3 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all duration-200"
                    >
                      <Link className="h-3.5 w-3.5" />
                      Link Only
                    </TabsTrigger>
                    <TabsTrigger 
                      value="both" 
                      className="flex items-center gap-2 rounded-lg py-2.5 px-3 text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm transition-all duration-200"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Both
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="images" className="mt-4">
                    <div>
                      <ImageUpload onChange={handleImageChange} maxFiles={3} />
                      {imageFiles.length === 0 && (
                        <p className="text-sm text-red-500 mt-1">
                          Please upload at least one image.
                        </p>
                      )}
                      <FormDescription className="text-gray-500 text-xs mt-2">
                        Upload up to 3 images of the item.
                      </FormDescription>
                    </div>
                  </TabsContent>

                  <TabsContent value="link" className="mt-4">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="ecommercePlatform"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black font-medium text-sm">E-commerce Platform</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full bg-gray-50 border-none rounded-xl h-12 px-4 text-black focus:bg-white focus:ring-2 focus:ring-black/20 transition-all duration-200">
                                  <SelectValue placeholder="Select platform" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-white border-none rounded-xl shadow-lg p-1">
                                {Array.from(ECOMMERCE_PLATFORMS.entries()).map(([value, label]) => (
                                  <SelectItem 
                                    key={value} 
                                    value={value}
                                    className="rounded-lg text-black hover:bg-gray-50 focus:bg-gray-50 py-2.5"
                                  >
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription className="text-gray-500 text-xs mt-1">
                              Choose the online platform where this item can be found.
                            </FormDescription>
                            <FormMessage className="text-red-500 text-xs" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="webLink"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-black font-medium text-sm">Product Link</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://example.com/product-link"
                                {...field}
                                className="w-full bg-gray-50 border-none rounded-xl h-12 px-4 text-black placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-black/20 transition-all duration-200"
                              />
                            </FormControl>
                            <FormDescription className="text-gray-500 text-xs mt-1">
                              Paste the direct link to the product page.
                            </FormDescription>
                            <FormMessage className="text-red-500 text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="both" className="mt-4">
                    <div className="space-y-6">
                      {/* Images Section */}
                      <div>
                        <FormLabel className="text-black font-medium text-sm">Images (Optional)</FormLabel>
                        <ImageUpload onChange={handleImageChange} maxFiles={3} />
                        <FormDescription className="text-gray-500 text-xs mt-2">
                          Upload up to 3 images of the item.
                        </FormDescription>
                      </div>

                      {/* Web Link Section */}
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="ecommercePlatform"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-black font-medium text-sm">E-commerce Platform (Optional)</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-full bg-gray-50 border-none rounded-xl h-12 px-4 text-black focus:bg-white focus:ring-2 focus:ring-black/20 transition-all duration-200">
                                    <SelectValue placeholder="Select platform" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-white border-none rounded-xl shadow-lg p-1">
                                  {Array.from(ECOMMERCE_PLATFORMS.entries()).map(([value, label]) => (
                                    <SelectItem 
                                      key={value} 
                                      value={value}
                                      className="rounded-lg text-black hover:bg-gray-50 focus:bg-gray-50 py-2.5"
                                    >
                                      {label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-red-500 text-xs" />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="webLink"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-black font-medium text-sm">Product Link (Optional)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://example.com/product-link"
                                  {...field}
                                  className="w-full bg-gray-50 border-none rounded-xl h-12 px-4 text-black placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-black/20 transition-all duration-200"
                                />
                              </FormControl>
                              <FormDescription className="text-gray-500 text-xs mt-1">
                                Paste the direct link to the product page.
                              </FormDescription>
                              <FormMessage className="text-red-500 text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormDescription className="text-black text-xs bg-gray-50 p-3 rounded-xl border border-gray-100">
                        Provide either images, a web link, or both. At least one is required.
                      </FormDescription>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Price (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter price"
                          {...field}
                          className="w-full bg-white border-gray-300 focus:border-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          className="w-full bg-white border-gray-300 focus:border-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full bg-white border-gray-300 focus:border-blue-500">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white border border-gray-200">
                          {Array.from(CATEGORIES.entries()).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="itemType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Item Type (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., smartphone, jacket"
                          {...field}
                          className="w-full bg-white border-gray-300 focus:border-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the item"
                        {...field}
                        className="min-h-[100px] bg-white border-gray-300 focus:border-blue-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Item"
                )}
              </Button>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
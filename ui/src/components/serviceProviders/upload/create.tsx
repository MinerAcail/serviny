import React, { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, X, Upload, CheckCircle, Link } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import BackButton from "@/components/back";
import { GET_ALL_GALLERY } from "../data/typesAndGql";
// import MainNaveBar from "../menuBar";

// GraphQL Mutations
const CREATE_GALLERY = gql`
  mutation CreateGallery($files: [Upload!]!, $input: GalleryProfessionInput!, $webLink: String) {
    createGallery(files: $files, input: $input, webLink: $webLink) {
      id
      title
      description
      categories
      imageUrls
      webLink
      createdAt
    }
  }
`;

// Types
interface Category {
  value: string;
  label: string;
}

interface GalleryProfessionInput {
  title?: string;
  description?: string;
  categories?: string[];
  imageUrls?: string[];
}

interface Image {
  url: string;
  file?: File;
  isNew?: boolean;
}

interface FormData {
  title: string;
  description: string;
  webLink?: string;
}

// Available categories for selection
const availableCategories: Category[] = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "interior", label: "Interior Design" },
  { value: "exterior", label: "Exterior" },
  { value: "renovation", label: "Renovation" },
  { value: "landscape", label: "Landscape" },
];

/**
 * Create Gallery Component with shadcn/ui components
 */
const CreateGalleryForm: React.FC = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      title: "",
      description: "",
      webLink: "",
    },
  });

  const [createGallery] = useMutation(CREATE_GALLERY, {
    refetchQueries: [GET_ALL_GALLERY],
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFiles([...files, ...newFiles]);

      // Generate preview URLs
      const newPreviews = newFiles.map((file) => ({
        url: URL.createObjectURL(file),
        file,
        isNew: true,
      }));

      setPreviewImages([...previewImages, ...newPreviews]);
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedPreviews = [...previewImages];
    const updatedFiles = [...files];

    // If it's a newly added file, also remove from files array
    if (previewImages[index].isNew) {
      const fileIndex = updatedFiles.findIndex(
        (file) => file === previewImages[index].file
      );
      if (fileIndex !== -1) {
        updatedFiles.splice(fileIndex, 1);
      }
    }

    // Remove the preview URL
    updatedPreviews.splice(index, 1);

    setPreviewImages(updatedPreviews);
    setFiles(updatedFiles);
  };

  const handleAddCategory = (category: string) => {
    if (category.trim() && !selectedCategories.includes(category)) {
      setSelectedCategories([...selectedCategories, category]);
    }
    setInputValue(""); // Clear input after adding
  };

  const handleRemoveCategory = (category: string) => {
    setSelectedCategories(selectedCategories.filter((c) => c !== category));
  };

  // URL validation function
  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);

    try {
      const input: GalleryProfessionInput = {
        title: data.title,
        description: data.description,
        categories: selectedCategories,
      };

      // Prepare webLink variable - only include if it's provided and valid
      const webLink = data.webLink?.trim() ? data.webLink.trim() : undefined;

      await createGallery({
        variables: {
          files,
          input,
          webLink,
        },
      });

      // Reset form on success
      reset();
      setSelectedCategories([]);
      setFiles([]);
      setPreviewImages([]);

      toast.success("Success!", {
        description: "Gallery created successfully.",
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
    <div className=" py-14 w-full">
      {/* <div className=" px-4 py-8 mx-auto "> */}
      <Card className="w-full max-w-3xl mx-auto">
        <BackButton />

        <CardHeader>
          <CardTitle className="text-2xl">Create New Gallery</CardTitle>
        </CardHeader>

        <CardContent>
          <form
            id="gallery-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="title"
                  className={errors.title ? "text-destructive" : ""}
                >
                  Gallery Title
                </Label>
                <Input
                  id="title"
                  placeholder="Enter gallery title"
                  {...register("title", { required: "Title is required" })}
                  className={errors.title ? "border-destructive" : ""}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="webLink"
                  className={errors.webLink ? "text-destructive" : ""}
                >
                  <div className="flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    Web Link (Optional)
                  </div>
                </Label>
                <Input
                  id="webLink"
                  type="url"
                  placeholder="https://example.com"
                  {...register("webLink", {
                    validate: (value) => {
                      if (!value || value.trim() === "") return true; // Optional field
                      return isValidUrl(value) || "Please enter a valid URL";
                    },
                  })}
                  className={errors.webLink ? "border-destructive" : ""}
                />
                {errors.webLink && (
                  <p className="text-sm text-destructive">
                    {errors.webLink.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Add a link to showcase this project online (e.g., project website, portfolio)
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className={errors.description ? "text-destructive" : ""}
                >
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe this gallery"
                  rows={4}
                  {...register("description", {
                    required: "Description is required",
                  })}
                  className={errors.description ? "border-destructive" : ""}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Categories</Label>

                {/* Select Dropdown */}
                <Select onValueChange={handleAddCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((category) => (
                      <SelectItem
                        key={category.value}
                        value={category.value}
                        disabled={selectedCategories.includes(category.value)}
                      >
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Manual Input for Custom Categories */}
                <Input
                  type="text"
                  placeholder="Type a category and press Enter"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCategory(inputValue);
                    }
                  }}
                  onBlur={() => {
                    if (inputValue.trim()) {
                      handleAddCategory(inputValue);
                    }
                  }}
                />

                {/* Display Selected Categories */}
                {selectedCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedCategories.map((category) => {
                      const categoryLabel =
                        availableCategories.find((c) => c.value === category)
                          ?.label || category;
                      return (
                        <Badge
                          key={category}
                          variant="secondary"
                          className="pl-2 pr-1 py-1"
                        >
                          {categoryLabel}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-1"
                            onClick={() => handleRemoveCategory(category)}
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
                  <Label>Upload Images</Label>
                  <div
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() =>
                      document.getElementById("gallery-images")?.click()
                    }
                  >
                    <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                    <p className="text-sm font-medium">
                      Drag images here or click to browse
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Supported formats: JPG, PNG, WebP
                    </p>
                    <Input
                      id="gallery-images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>

                {previewImages.length > 0 && (
                  <div className="space-y-2">
                    <Label>Image Previews ({previewImages.length})</Label>
                    <ScrollArea className="h-64 w-full rounded-md border">
                      <div className="grid grid-cols-3 gap-4 p-4">
                        {previewImages.map((image, index) => (
                          <div
                            key={index}
                            className="relative rounded-md overflow-hidden group"
                          >
                            <img
                              src={image.url}
                              alt={`Preview ${index}`}
                              className="w-full h-24 object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleRemoveImage(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
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
              setSelectedCategories([]);
              setFiles([]);
              setPreviewImages([]);
              window.history.back();
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="gallery-form"
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
                Create Gallery
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CreateGalleryForm;
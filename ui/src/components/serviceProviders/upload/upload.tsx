import React, { useState, useEffect } from "react";
import { useMutation, gql } from "@apollo/client";

const UPDATE_GALLERY = gql`
  mutation UpdateGallery(
    $galleryId: ID!
    $files: [Upload!]
    $input: GalleryProfessionInput!
  ) {
    updateGallery(galleryId: $galleryId, files: $files, input: $input) {
      id
      title
      description
      categories
      imageUrls
      updatedAt
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
 * Update Gallery Component
 */
interface UpdateGalleryFormProps {
  galleryId: string;
  initialData?: {
    title?: string;
    description?: string;
    categories?: string[];
    imageUrls?: string[];
  };
}

export const UpdateGalleryForm: React.FC<UpdateGalleryFormProps> = ({
  galleryId,
  initialData,
}) => {
  const [title, setTitle] = useState<string>(initialData?.title || "");
  const [description, setDescription] = useState<string>(
    initialData?.description || ""
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialData?.categories || []
  );
  const [files, setFiles] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const [updateGallery] = useMutation(UPDATE_GALLERY);

  // Initialize images from existing URLs
  useEffect(() => {
    if (initialData?.imageUrls) {
      const existingImages = initialData.imageUrls.map((url) => ({
        url,
        isNew: false,
      }));
      setPreviewImages(existingImages);
    }
  }, [initialData]);

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

  const handleCategoryChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const values = Array.from(
      event.target.selectedOptions,
      (option) => option.value
    );
    setSelectedCategories(values);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Prepare image URLs from existing images that weren't removed
      const existingImageUrls = previewImages
        .filter((img) => !img.isNew)
        .map((img) => img.url);

      const input: GalleryProfessionInput = {
        title,
        description,
        categories: selectedCategories,
        imageUrls: existingImageUrls,
      };

      await updateGallery({
        variables: {
          galleryId,
          files: files.length > 0 ? files : undefined,
          input,
        },
      });

      setSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="update-gallery-container max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Update Gallery</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Gallery updated successfully!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="title"
          >
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="description"
          >
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows={4}
          />
        </div>

        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="categories"
          >
            Categories
          </label>
          <select
            id="categories"
            multiple
            value={selectedCategories}
            onChange={handleCategoryChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            {availableCategories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">
            Hold Ctrl/Cmd to select multiple categories
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            Add New Images
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>

        {previewImages.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Gallery Images</h3>
            <div className="grid grid-cols-3 gap-4">
              {previewImages.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image.url}
                    alt={`Image ${index}`}
                    className="w-full h-32 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    ×
                  </button>
                  {image.isNew && (
                    <span className="absolute bottom-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-tl">
                      New
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={isLoading}
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? "Updating..." : "Update Gallery"}
          </button>
        </div>
      </form>
    </div>
  );
};

import React, { useState, useEffect, useRef } from "react";
import { useQuery, gql } from "@apollo/client";
import {
  X,
  ChevronRight,
  Eye,
  Grid,
  NotepadText,
  PictureInPicture2,
  PictureInPicture,
} from "lucide-react";
import { ProductCard, ProductDetailDialog } from "@/vendor/AllProducts";
import { SubmitRequestItemDialog } from "@/components/custom/users/userReview/submitRequestItemForm";
import { Button } from "@/components/ui/button";
import SocialMediaManager from "@/components/custom/Socials/forms";
import UserAuthCard from "@/components/custom/users/create";
import { useAuth } from "@/middleware/context/authContext";
import { DeliveryServiceSystem } from "../../APPOINTMENT/DeliveryServiceBooking/DeliveryServiceSystem";
import { getImageUrl } from "@/components/global/formatPrice";

// GraphQL Queries
const GET_ALL_GALLERY = gql`
  query GetAllGallery(
    $serviceId: String!
    $query: String
    $limit: Int
    $offset: Int
  ) {
    getAllGallery(
      ServiceId: $serviceId
      query: $query
      limit: $limit
      offset: $offset
    ) {
      id
      title
      description
      categories
      imageUrls
      createdAt
      updatedAt
      webLink
    }
  }
`;

const GET_ALL_PRODUCTS = gql`
  query GetAllProducts(
    $vendorId: String!
    $query: String
    $limit: Int
    $offset: Int
  ) {
    getAllProducts(
      vendorId: $vendorId
      query: $query
      limit: $limit
      offset: $offset
    ) {
      id
      name
      state
      description
      categories
      imageUrls
      itemsType
      createdAt
      updatedAt
      price
    }
  }
`;

const GET_ALL_CATEGORY_BOX = gql`
  query GetAllCategoryBox($query: String, $vendorId: String!) {
    getAllCategoryBox(query: $query, vendorId: $vendorId) {
      categoryBox {
        id
        name
        itemsIds
        imageUrl
        state
        vendorId
        createdAt
        updatedAt
      }
      products {
        id
        name
        price
        imageUrls
        description
      }
    }
  }
`;

// TypeScript interfaces
interface GalleryItem {
  id: string;
  title: string;
  description: string;
  webLink: string;

  categories: string[];
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
}

interface CategoryBox {
  id: string;
  name: string;
  imageUrl: string;
  state: string;
  itemsIds: string[];
  vendorId: string;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  id: string;
  name: string;
  state: string;
  description: string;
  categories: string[];
  imageUrls: string[];
  itemsType: string;
  createdAt: string;
  updatedAt: string;
  price: number;
  VendorId?: string;
}

interface CategoryBoxResponse {
  categoryBox: CategoryBox[];
  products: Product[];
}

// Props interfaces
interface DropShippingPageProps {
  serviceId?: string;

  filter?: string;
  limit?: number;
  provider: provider;
}
interface provider {
  number?: string;
  email?: string;
  location?: string;
}
interface GallerySectionProps {
  serviceId: string;
  filter?: string;
  limit?: number;
}

interface ProductsSectionProps {
  vendorId: string;
  filter?: string;
  limit?: number;
}
interface CategoriesSectionProps {
  vendorId: string;
}
const GallerySection: React.FC<GallerySectionProps> = ({
  serviceId,
  filter = "all",
  limit = 20,
}) => {
  const [showGalleryDialog, setShowGalleryDialog] = useState<boolean>(false);
  const [visibleItems, setVisibleItems] = useState<number>(4);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { loading, error, fetchMore, refetch } = useQuery<{
    getAllGallery: GalleryItem[];
  }>(GET_ALL_GALLERY, {
    variables: {
      serviceId,
      query: filter === "all" ? null : filter.toLowerCase(),
      limit,
      offset: 0,
    },
    onCompleted: (data) => {
      setGalleryItems(data.getAllGallery);
      setHasMore(data.getAllGallery.length === limit);
    },
  });

  useEffect(() => {
    const updateVisibleItems = () => {
      const width = window.innerWidth;
      if (width < 640) setVisibleItems(2);
      else if (width < 768) setVisibleItems(3);
      else if (width < 1024) setVisibleItems(4);
      else setVisibleItems(5);
    };

    updateVisibleItems();
    window.addEventListener("resize", updateVisibleItems);
    return () => window.removeEventListener("resize", updateVisibleItems);
  }, []);

  useEffect(() => {
    if (galleryItems.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % galleryItems.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [galleryItems.length]);

  const getVisibleImages = (): (GalleryItem & { displayIndex: number })[] => {
    if (galleryItems.length === 0) return [];
    const items: (GalleryItem & { displayIndex: number })[] = [];
    for (let i = 0; i < Math.min(visibleItems, galleryItems.length); i++) {
      const index = (currentIndex + i) % galleryItems.length;
      items.push({ ...galleryItems[index], displayIndex: i });
    }
    return items;
  };

  if (loading && galleryItems.length === 0) {
    return (
      <section className="py-6 sm:py-8 md:py-16 bg-gradient-to-br from-purple-50 to-blue-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-6 sm:py-8 md:py-16 bg-gradient-to-br from-purple-50 to-blue-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center text-red-600">
            <p>Error loading gallery: {error.message}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-6 pb-4 bg-[#d8f3de8c] rounded-lg overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8 space-y-3 sm:space-y-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-blue-400">
            Online Store
          </h2>
          <button
            onClick={() => setShowGalleryDialog(true)}
            className="group flex items-center justify-center sm:justify-start space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 sm:py-3 rounded-full border border-purple-200 hover:border-purple-400 transition-all duration-300 hover:shadow-lg w-full sm:w-auto text-sm sm:text-base"
          >
            <Eye className="w-4 h-4 text-purple-600" />
            <span className="font-medium text-gray-700">View More</span>
            <ChevronRight className="w-3 h-3 text-purple-600 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="relative w-full overflow-hidden">
          <div className="flex space-x-3 sm:space-x-4 md:space-x-6 transition-transform duration-500 ease-in-out">
            {getVisibleImages().map((image) => (
              <div
                key={`${image.id}-${image.displayIndex}`}
                className="flex-shrink-0 w-full group cursor-pointer"
                style={{
                  width: `calc((100% - ${
                    (visibleItems - 1) * 1.5
                  }rem) / ${visibleItems})`,
                }}
              >
                <div className="relative overflow-hidden rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-500">
                  <a
                    href={image.webLink || "#"}
                    target={image.webLink ? "_blank" : undefined}
                    rel={image.webLink ? "noopener noreferrer" : undefined}
                  >
                    <img
                      src={
                        getImageUrl(image.imageUrls?.[0]) ||
                        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"
                      }
                      alt={image.title}
                      className="w-full h-24 sm:h-28 md:h-32 lg:h-36 object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                    <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3 md:bottom-4 md:left-4 md:right-4">
                      <h3 className="text-white font-semibold text-xs sm:text-sm md:text-lg drop-shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {image.title}
                      </h3>
                    </div>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showGalleryDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-4xl w-full max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 sm:p-6 flex items-center justify-between rounded-t-xl sm:rounded-t-2xl lg:rounded-t-3xl">
              <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800">
                Gallery Collection
              </h3>
              <button
                onClick={() => setShowGalleryDialog(false)}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
              </button>
            </div>
            <div className="p-3 sm:p-4 lg:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {galleryItems.map((image) => (
                <div key={image.id} className="group cursor-pointer">
                   <a
                    href={image.webLink || "#"}
                    target={image.webLink ? "_blank" : undefined}
                    rel={image.webLink ? "noopener noreferrer" : undefined}
                  >
                  <div className="relative overflow-hidden rounded-lg shadow-md group-hover:shadow-xl transition-shadow duration-300">
                    <img
                      src={
                        getImageUrl(image.imageUrls?.[0]) ||
                        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"
                      }
                      alt={image.title}
                      className="w-full h-24 sm:h-32 lg:h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  </div>
                  <p className="mt-2 font-medium text-gray-700 text-xs sm:text-sm lg:text-base">
                    {image.title}
                  </p>
                  {image.description && (
                    <p className="text-gray-500 text-xs sm:text-sm mt-1 line-clamp-2">
                      {image.description}
                    </p>
                  )}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

const CategoriesSection: React.FC<CategoriesSectionProps> = ({ vendorId }) => {
  const [showCategoriesDialog, setShowCategoriesDialog] =
    useState<boolean>(false);
  const [visibleItems, setVisibleItems] = useState<number>(4);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const { loading, error, data } = useQuery<{
    getAllCategoryBox: CategoryBoxResponse[];
  }>(GET_ALL_CATEGORY_BOX, {
    variables: { query: null, vendorId },
  });

  // console.log("datadata1", vendorId);
  // console.log("Raw data response:", data);

  // Extract category boxes from the response structure
  const categories: CategoryBox[] =
    data?.getAllCategoryBox?.map((item) => item.categoryBox) || [];
  // console.log("Processed categories:", categories);

  useEffect(() => {
    const updateVisibleItems = () => {
      const width = window.innerWidth;
      if (width < 640) setVisibleItems(2);
      else if (width < 768) setVisibleItems(3);
      else if (width < 1024) setVisibleItems(4);
      else setVisibleItems(5);
    };

    updateVisibleItems();
    window.addEventListener("resize", updateVisibleItems);
    return () => window.removeEventListener("resize", updateVisibleItems);
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % categories.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [categories.length]);

  const getVisibleCategories = (): (CategoryBox & {
    displayIndex: number;
  })[] => {
    if (categories.length === 0) return [];
    const items: (CategoryBox & { displayIndex: number })[] = [];
    for (let i = 0; i < Math.min(visibleItems, categories.length); i++) {
      const index = (currentIndex + i) % categories.length;
      items.push({ ...categories[index], displayIndex: i });
    }
    return items;
  };

  if (loading) {
    return (
      <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center h-40">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-emerald-200 rounded-full animate-spin"></div>
              <div className="absolute top-0 left-0 w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg">
              <p className="text-red-700 font-medium">
                Error loading categories
              </p>
              <p className="text-red-600 text-sm mt-1">{error.message}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Show message if no categories found
  if (categories.length === 0) {
    return (
      <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Grid className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent mb-2">
                Categories
              </h2>
              <p className="text-slate-600">
                No categories found for this vendor.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-8 ">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 md:mb-12 space-y-4 sm:space-y-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-blue-400">
            Categories
          </h2>
          <button
            onClick={() => setShowCategoriesDialog(true)}
            className="group flex items-center justify-center sm:justify-start space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 sm:py-3 rounded-full border border-purple-200 hover:border-purple-400 transition-all duration-300 hover:shadow-lg w-full sm:w-auto text-sm sm:text-base"
          >
            <Eye className="w-4 h-4 text-purple-600" />
            <span className="font-medium text-gray-700">View More</span>
            <ChevronRight className="w-3 h-3 text-purple-600 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Categories Grid */}
        <div className="relative">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {getVisibleCategories().map((category, index) => (
              <div
                key={`${category.id}-${category.displayIndex}`}
                className="group cursor-pointer"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div className="relative h-48 sm:h-56 lg:h-64 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-white to-slate-50">
                  {/* Background Image */}
                  {category.imageUrl ? (
                    <>
                      <img
                        src={getImageUrl(category.imageUrl)}
                        alt={category.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const fallback = target.parentElement?.querySelector(
                            ".fallback-pattern"
                          ) as HTMLElement;
                          if (fallback) fallback.style.display = "block";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-green-100 to-teal-100"></div>
                  )}

                  {/* Fallback Pattern */}
                  <div
                    className={`fallback-pattern absolute inset-0 bg-gradient-to-br from-emerald-200 via-green-200 to-teal-200 ${
                      category.imageUrl ? "hidden" : "block"
                    }`}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                  ></div>

                  {/* Decorative Elements */}
                  <div className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                  </div>

                  {/* Category Icon/Letter */}
                  {!category.imageUrl && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-green-500 rounded-3xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                        <span className="text-3xl font-bold text-white">
                          {category.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div
                      className={`${
                        category.imageUrl ? "text-white" : "text-slate-800"
                      } transition-all duration-300`}
                    >
                      <h3 className="text-lg sm:text-xl font-bold mb-1 group-hover:scale-105 transition-transform duration-300">
                        {category.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            category.imageUrl
                              ? "bg-emerald-400"
                              : "bg-emerald-500"
                          }`}
                        ></div>
                        <p
                          className={`text-sm font-medium ${
                            category.imageUrl
                              ? "text-white/90"
                              : "text-slate-600"
                          }`}
                        >
                          {category.itemsIds?.length || 0} items
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 rounded-3xl ring-0 group-hover:ring-4 ring-emerald-500/20 transition-all duration-300"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Dialog */}
      {showCategoriesDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-green-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">All Categories</h3>
                  <p className="text-emerald-100 mt-1">
                    {categories.length} categories available
                  </p>
                </div>
                <button
                  onClick={() => setShowCategoriesDialog(false)}
                  className="p-3 hover:bg-white/20 rounded-2xl transition-colors duration-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category, index) => (
                  <div
                    key={category.id}
                    className="group cursor-pointer"
                    style={{
                      animationDelay: `${index * 50}ms`,
                    }}
                  >
                    <div className="relative h-40 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      {/* Background */}
                      {category.imageUrl ? (
                        <>
                          <img
                            src={getImageUrl(category.imageUrl)}
                            alt={category.name}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              const fallback =
                                target.parentElement?.querySelector(
                                  ".modal-fallback"
                                ) as HTMLElement;
                              if (fallback) fallback.style.display = "block";
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 via-green-100 to-teal-100"></div>
                      )}

                      {/* Modal Fallback */}
                      <div
                        className={`modal-fallback absolute inset-0 bg-gradient-to-br from-emerald-200 to-green-200 ${
                          category.imageUrl ? "hidden" : "block"
                        }`}
                      ></div>

                      {/* Icon for non-image cards */}
                      {!category.imageUrl && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-xl font-bold text-white">
                              {category.name?.charAt(0)?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Content */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h4
                          className={`font-bold text-lg mb-1 ${
                            category.imageUrl ? "text-white" : "text-slate-800"
                          }`}
                        >
                          {category.name}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              category.imageUrl
                                ? "bg-emerald-400"
                                : "bg-emerald-500"
                            }`}
                          ></div>
                          <p
                            className={`text-sm font-medium ${
                              category.imageUrl
                                ? "text-white/90"
                                : "text-slate-600"
                            }`}
                          >
                            {category.itemsIds?.length || 0} items
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
const ProductsSection: React.FC<ProductsSectionProps> = ({
  vendorId,
  filter = "all",
  limit = 20,
}) => {
  const [productItems, setProductItems] = useState<Product[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  const { loading, error, fetchMore, refetch } = useQuery<{
    getAllProducts: Product[];
  }>(GET_ALL_PRODUCTS, {
    variables: {
      vendorId,
      query: filter === "all" ? "" : filter.toLowerCase(),
      limit,
      offset: 0,
    },
    onCompleted: (data) => {
      setProductItems(data.getAllProducts);
      setHasMore(data.getAllProducts.length === limit);
    },
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          loadMoreProducts();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [loading, hasMore]);

  const loadMoreProducts = async (): Promise<void> => {
    if (!hasMore) return;

    try {
      const { data } = await fetchMore({
        variables: {
          offset: productItems.length,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;

          const newProducts = fetchMoreResult.getAllProducts;
          setHasMore(newProducts.length === limit);
          setProductItems((prevItems) => [...prevItems, ...newProducts]);

          return {
            getAllProducts: [...prev.getAllProducts, ...newProducts],
          };
        },
      });
    } catch (error) {
      console.error("Error loading more products:", error);
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleDialogClose = () => {
    setSelectedProduct(null);
  };

  if (loading && productItems.length === 0) {
    return (
      <section className="py-6 sm:py-8 md:py-16 bg-gradient-to-br from-orange-50 to-red-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-6 sm:py-8 md:py-16 bg-gradient-to-br from-orange-50 to-red-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center text-red-600">
            <p>Error loading products: {error.message}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="py-6 mt-2  bg-[#fff9f590] min-h-screen rounded-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-6 md:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
              Products
            </h2>
          </div>

          {/* Product Grid Layout */}
          <div className="grid  grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {productItems.map((product: Product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={handleProductClick}
              />
            ))}
          </div>

          {/* Loading/No More Products Indicator */}
          <div ref={observerRef} className="py-6 sm:py-8 flex justify-center">
            {loading && (
              <div className="flex items-center space-x-2 text-orange-600">
                <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="font-medium text-sm sm:text-base">
                  Loading more products...
                </span>
              </div>
            )}
            {!hasMore && productItems.length > 0 && (
              <p className="text-gray-500 text-sm sm:text-base">
                No more products to load
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Product Detail Dialog */}
      <ProductDetailDialog
        product={selectedProduct}
        open={!!selectedProduct}
        onOpenChange={(open: boolean) => !open && handleDialogClose()}
        vendorId={vendorId}
        refetch={() => refetch()}
      />
    </>
  );
};

export function DropShippingPage({
  serviceId,
  filter = "all",
  limit = 20,
  provider,
}: DropShippingPageProps) {
  const { isAuthenticated } = useAuth();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [bookText, setBookText] = useState("Book Delivery");

  // Update useEffect to only run interval if not hovered
  useEffect(() => {
    if (isHovered) return;

    const options = ["Book Delivery", "Book Rider"];
    let index = 0;

    const interval = setInterval(() => {
      index = (index + 1) % options.length;
      setBookText(options[index]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isHovered]);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <div className="mb-3 flex  items-end justify-between gap-4 sm:flex-row sm:items-center">
        {isAuthenticated ? (
          <div className="grid grid-cols-2 gap-2">
            <SubmitRequestItemDialog serviceId={serviceId ?? ""}>
              <Button
                variant="secondary"
                className="gap-2 rounded-full bg-secondary hover:bg-secondary/90"
              >
                <PictureInPicture className="h-4 w-4" />
                Request Item
              </Button>
            </SubmitRequestItemDialog>
            <Button
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={() => setDialogOpen(true)}
              variant="secondary"
              className="gap-2 rounded-full bg-secondary hover:bg-secondary/90"
            >
              <NotepadText className="h-4 w-4" />
              {bookText}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <UserAuthCard>
              <Button className="gap-2">
                <PictureInPicture className="h-4 w-4" />
                Request Item
              </Button>
            </UserAuthCard>
            <UserAuthCard>
              <Button
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {bookText}
              </Button>
            </UserAuthCard>
          </div>
        )}
        <SocialMediaManager provider={provider} serviceId={serviceId ?? ""} />
      </div>
      <GallerySection
        serviceId={serviceId ?? ""}
        filter={filter}
        limit={limit}
      />
      <CategoriesSection vendorId={serviceId ?? ""} />
      <ProductsSection
        vendorId={serviceId ?? ""}
        filter={filter}
        limit={limit}
      />
      <DeliveryServiceSystem
        isDialogOpenMain={isDialogOpen}
        setDialogOpenMain={setDialogOpen}
        serviceId={serviceId}
      />
    </div>
  );
}

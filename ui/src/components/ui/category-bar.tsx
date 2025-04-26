"use client";

import { gql, useQuery } from "@apollo/client";
import { useRef, useState, useEffect } from "react";

const GET_ALL_CATEGORIES = gql`
  query GetAllCategories {
    getAllCategories
  }
`;

interface GetAllCategoriesData {
  getAllCategories: string[];
}

interface CategoryBarProps {
  onCategoryChange: (category: string) => void;
}

export default function CategoryBar({ onCategoryChange }: CategoryBarProps) {
  const { data, loading, error } = useQuery<GetAllCategoriesData>(GET_ALL_CATEGORIES);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories: string[] = ["All", ...(data?.getAllCategories || [])];

  const checkScroll = () => {
    if (!containerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScroll);
      checkScroll();
      return () => container.removeEventListener("scroll", checkScroll);
    }
  }, []);

 const handleCategoryClick = (category: string) => {
  setActiveCategory(category);
  onCategoryChange(category === "All" ? "" : category); // Send null if "All" is selected
};


  if (loading) return <p>Loading categories...</p>;
  if (error) return <p>Error loading categories</p>;
  if (!data?.getAllCategories || data.getAllCategories.length === 0) return null
  return (
    <div className="fixed right-[-10px] w-screen overflow-hidden py-2 m-2 bg-white rounded-2xl">
      {showLeftArrow && (
        <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center">
          <div className="h-full w-12 "></div>
        </div>
      )}

      <div
        ref={containerRef}
        className="flex space-x-3 overflow-x-auto px-4 scrollbar-hide"
        onScroll={checkScroll}
      >
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryClick(category)}
            className={`rounded-lg m-1 px-4 py-1 text-[12px] font-medium whitespace-nowrap transition-colors ${
              category === activeCategory
                ? "bg-green-300"
                : "bg-neutral-600 text-white hover:bg-neutral-600"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {showRightArrow && (
        <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center">
          <div className="h-full w-16 "></div>
        </div>
      )}
    </div>
  );
}

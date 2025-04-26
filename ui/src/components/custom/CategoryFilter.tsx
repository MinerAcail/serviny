import React from "react";
import { Button } from "@/components/ui/button";
// import { ServerLogo } from "@/app/HostelStoreApp";

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  setSelectedCategory,
}) => (
  <div className="mb-6 flex space-x-2 justify-center">
    {/* <ServerLogo/> */}
    {categories.map((category) => (
      <Button
        key={category}
        variant={selectedCategory === category ? "default" : "outline"}
        onClick={() => setSelectedCategory(category)}
        className="px-4"
      >
        {category}
      </Button>
    ))}
  </div>
);

export default CategoryFilter;

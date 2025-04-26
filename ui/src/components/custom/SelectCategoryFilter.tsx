import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
  
  interface SelectCategoryFilterProps {
    categories: string[];
    selectedCategory: string;
    setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
  }
  
  const SelectCategoryFilter: React.FC<SelectCategoryFilterProps> = ({
    categories,
    selectedCategory,
    setSelectedCategory,
  }) => {
    return (
      <Select  onValueChange={(value) => setSelectedCategory(value)} value={selectedCategory}>
        <SelectTrigger className="md:w-[180px] w-fit bg-white">
          <SelectValue placeholder="Select a Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Categories</SelectLabel>
            {categories.map((category,idx) => (
              <SelectItem key={idx} value={category} className="px-4">
                {category}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    );
  };
  
  export default SelectCategoryFilter;
  
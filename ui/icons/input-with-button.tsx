import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

interface SearchProps {
  onSearch?: (value: string) => void;
  isExpanded: boolean;
    setIsExpanded: (value: boolean) => void;
}

const InputWithButton: React.FC<SearchProps> = ({ onSearch,isExpanded, setIsExpanded }) => {
//   const [isExpanded, setIsExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);


  // Handle click outside to collapse
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsExpanded(false);
        setSearchValue("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded]);

  // Auto-focus input when expanding
  useEffect(() => {
    if (isExpanded) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isExpanded]);

  const toggleSearch = () => {
    setIsExpanded(!isExpanded);
    if (isExpanded) {
      setSearchValue("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim() && onSearch) {
      
      onSearch(searchValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsExpanded(false);
      setSearchValue("");
    }
  };

  return (
    <div ref={containerRef} className="relative flex items-center justify-end">
      {/* Search button is always visible first */}
      <Button
        ref={buttonRef}
        type="button"
        size="icon"
        variant="ghost"
        onClick={toggleSearch}
        className={`
            rounded-full transition-all duration-300 ease-in-out
          ${
            isExpanded
              ? "bg-background hover:bg-secondary"
              : "bg-primary/5 hover:bg-primary/10"
          }
        `}
        aria-label={isExpanded ? "Close search" : "Open search"}
      >
        <div className="relative w-4 h-4">
          <Search
            className={`
              absolute inset-0 transition-all duration-300 ease-in-out 
              ${
                isExpanded
                  ? "opacity-0 scale-0 rotate-90"
                  : "opacity-100 scale-100 rotate-0"
              }
            `}
          />
          <X
            className={`
              absolute inset-0 transition-all duration-300 ease-in-out 
              ${
                isExpanded
                  ? "opacity-100 scale-100 rotate-0"
                  : "opacity-0 scale-0 rotate-90"
              }
            `}
          />
        </div>
      </Button>

      {/* Search form slides in when expanded */}
      <form
        onSubmit={handleSubmit}
        className={`
          absolute right-0 flex items-center
          transition-all duration-300 ease-in-out
          ${
            isExpanded
              ? "opacity-100 translate-x-0"
              : "opacity-0 translate-x-8 pointer-events-none"
          }
        `}
      >
        <div
          className={`
            flex items-center overflow-hidden rounded-full border bg-background
            transition-all duration-300 ease-in-out shadow-md
            ${isExpanded ? "w-64 border-primary/20" : "w-0 border-transparent"}
          `}
        >
          <div className="flex items-center w-full">
            {!searchValue && (
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
            )}
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="border-0 pl-10 h-10 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
            />
          </div>
        </div>

    
    
      </form>
    </div>
  );
};

export default InputWithButton;

"use client"

import { useEffect, useState } from "react"
import { useQuery } from "@apollo/client"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { gql } from "@apollo/client"
import logo from "../../assets/logo.png";

const GET_ALL_CATEGORIES = gql`
  query GetAllCategories {
    getAllCategories
  }
`



interface GetAllCategoriesData {
  getAllCategories: string[]
}

export function WelcomePopupCard({onSearch}:{onSearch: (value: string) => void;}) {
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    return localStorage.getItem("catePopupClosed") !== "true"
  })

  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const { data, loading, error } = useQuery<GetAllCategoriesData>(GET_ALL_CATEGORIES)
  const categories = data?.getAllCategories.map((category, index) => ({
    id: `${category.toLowerCase().replace(/\s+/g, "-")}-${index}`, // Append index to ensure uniqueness
    name: category,
  })) || [];
  
  
  

  const handleCategoryClick = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter((id) => id !== categoryId))
    } else {
      setSelectedCategories([...selectedCategories, categoryId])
    }
  }

  useEffect(() => {
    if (!isVisible) return

    const timeout = setTimeout(() => {
      setIsVisible(false)
    }, 90000)

    return () => clearTimeout(timeout)
  }, [isVisible])

  function handleDontShowAgain() {
    setIsVisible(false)
    localStorage.setItem("catePopupClosed", "true")
  }

  function handleClose() {
    setIsVisible(false)
  }

  function handleContinue() {
    onSearch(selectedCategories.map(id => categories.find(category => category.id === id)?.name).filter(Boolean).join(", "));

    console.log("Selected categories:", )
    setIsVisible(false)
  }

  if (!isVisible) return null

  if (loading) {
    return <div>Loading categories...</div>
  }

  if (error) {
    return <div>Error loading categories</div>
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-3 sm:p-4 animate-in fade-in duration-300">
      <Card className="w-full max-h-[90vh] overflow-auto max-w-[95vw] sm:max-w-lg md:max-w-xl lg:max-w-2xl shadow-lg animate-in zoom-in-90 duration-300">
        <CardHeader className="relative px-4 py-3 sm:px-6 sm:py-4 border-b">
          <Button variant="ghost" size="icon" className="absolute right-2 top-2 sm:right-4 sm:top-4 h-7 w-7 sm:h-8 sm:w-8" onClick={handleClose}>
            <X className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="sr-only">Close</span>
          </Button>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="bg-[#f3f0f0] p-2 sm:p-3 rounded-full">
              {/* <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" /> */}
              <img src={logo} alt="serviny Logo" className="w-12 " />

            </div>
            <div>
              <CardTitle className="text-lg sm:text-xl md:text-2xl text-primary">Welcome to Winnmart</CardTitle>
              <CardDescription className="text-xs sm:text-sm md:text-base mt-1">
                Select categories to personalize your shopping experience
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={selectedCategories.includes(category.id) ? "default" : "outline"}
                className={cn(
                  "cursor-pointer text-xs sm:text-sm transition-all",
                  "px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2",
                  selectedCategories.includes(category.id) 
                    ? "bg-primary text-primary-foreground hover:bg-primary/80" 
                    : "bg-background hover:bg-muted"
                )}
                onClick={() => handleCategoryClick(category.id)}
              >
                {category.name}
              </Badge>
            ))}
          </div>

          {selectedCategories.length > 0 && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-muted rounded-lg">
              <p className="text-xs sm:text-sm font-medium">Selected categories ({selectedCategories.length}):</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedCategories.map((id) => (
                  <Badge 
                    key={id} 
                    className="bg-primary/20 text-primary hover:bg-primary/30 text-xs px-1 py-1 sm:px-2"
                  >
                    {categories.find((c) => c.id === id)?.name}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCategoryClick(id)
                      }}
                      className="ml-1 hover:text-primary/70"
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove</span>
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:justify-between px-4 py-3 sm:px-6 sm:py-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDontShowAgain}
            className="w-full sm:w-auto text-xs sm:text-sm order-2 sm:order-1"
          >
            Don't show again
          </Button>
          <Button
            onClick={handleContinue}
            size="sm"
            className="w-full sm:w-auto text-xs sm:text-sm order-1 sm:order-2"
            disabled={selectedCategories.length === 0}
          >
            {selectedCategories.length > 0 
              ? selectedCategories.length > 1 
                ? `Continue with ${selectedCategories.length} categories` 
                : "Continue with selected category"
              : "Select categories to continue"
            }
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

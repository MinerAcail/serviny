import React from "react"
import { Search, Loader2, X } from "lucide-react"
import { Input } from "@/components/ui/input"

interface Prediction {
  description: string
  place_id: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

interface SearchBoxProps {
  searchValue: string
  isLoaded: boolean
  loading: boolean
  isSearchLoading: boolean
  predictions: Prediction[]
  showPredictions: boolean
  searchInputRef: React.RefObject<HTMLInputElement>
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handlePredictionSelect: (place: Prediction) => void
  handleClearSearch: () => void
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  searchValue,
  isLoaded,
  loading,
  isSearchLoading,
  predictions,
  showPredictions,
  searchInputRef,
  handleSearchChange,
  handlePredictionSelect,
  handleClearSearch
}) => {
  return (
    <div className="space-y-1">
      <div className="relative" ref={searchInputRef}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <Search className="h-5 w-5 text-[#86868B]" />
          </div>
          <Input
            type="text"
            placeholder="Search for a location to check delivery..."
            className="pl-12 pr-10 py-6 rounded-xl border-[#E5E5EA] bg-white focus-visible:ring-[#0071E3] text-[#1D1D1F]"
            value={searchValue}
            onChange={handleSearchChange}
            disabled={!isLoaded || loading}
          />
          {isSearchLoading && (
            <div className="absolute inset-y-0 right-10 flex items-center pr-3">
              <Loader2 className="h-4 w-4 text-[#86868B] animate-spin" />
            </div>
          )}
          {searchValue && (
            <button
              className="absolute inset-y-0 right-0 flex items-center pr-4"
              onClick={handleClearSearch}
            >
              <X className="h-5 w-5 text-[#86868B] hover:text-[#1D1D1F]" />
            </button>
          )}
        </div>

        {/* Predictions dropdown */}
        {showPredictions && predictions.length > 0 && (
          <div className="absolute z-20 mt-2 w-full bg-white rounded-xl shadow-lg border border-[#E5E5EA] overflow-hidden">
            <ul className="py-1">
              {predictions.map((place) => (
                <li
                  key={place.place_id}
                  className="px-4 py-3 hover:bg-[#F5F5F7] cursor-pointer transition-colors"
                  onClick={() => handlePredictionSelect(place)}
                >
                  <div className="font-medium text-[#1D1D1F]">
                    {place.structured_formatting.main_text}
                  </div>
                  <div className="text-sm text-[#86868B]">
                    {place.structured_formatting.secondary_text}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
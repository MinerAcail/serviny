"use client"

import type React from "react"
import { Check, Plus, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

// Type Definitions for Forms
interface PriceInput {
  label: string
  value: string
}

interface AmenityInput {
  text: string
}

interface PriceCardInput {
  title: string
  description: string
  prices: PriceInput[]
  amenities: AmenityInput[]
}

interface PolicyDetailInput {
  title: string
  content: string
  listItems: string[]
}

interface PolicyInput {
  name: string
  description: string
  details: PolicyDetailInput[]
}

// Form Field Component
const FormField: React.FC<{
  label: string
  id: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  multiline?: boolean
}> = ({ label, id, value, onChange, placeholder, multiline = false }) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="text-sm font-semibold text-gray-800">
      {label}
    </Label>
    {multiline ? (
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="backdrop-blur-sm bg-white/60 border-white/30 rounded-xl focus:bg-white/80 transition-all duration-200"
        rows={3}
      />
    ) : (
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="backdrop-blur-sm bg-white/60 border-white/30 rounded-xl focus:bg-white/80 transition-all duration-200"
      />
    )}
  </div>
)

// Price Input Component
const PriceInputComponent: React.FC<{
  label: string
  value: string
  onLabelChange: (value: string) => void
  onValueChange: (value: string) => void
  onRemove: () => void
  canRemove: boolean
}> = ({ label, value, onLabelChange, onValueChange, onRemove, canRemove }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl backdrop-blur-sm bg-white/40 border border-white/20">
    <Input
      value={label}
      onChange={(e) => onLabelChange(e.target.value)}
      className="flex-1 text-sm bg-white/60 border-white/30 rounded-lg"
      placeholder="Price label"
    />
    <div className="flex items-center gap-2">
      <span className="text-sm font-semibold text-gray-700">GH₵</span>
      <Input
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="w-24 text-right font-bold bg-white/60 border-white/30 rounded-lg"
        placeholder="0"
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="p-2 h-9 w-9 rounded-lg hover:bg-red-100/60 transition-colors"
        disabled={!canRemove}
      >
        <Trash className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  </div>
)

// Amenity Input Component
const AmenityInputComponent: React.FC<{
  text: string
  onChange: (value: string) => void
  onRemove: () => void
  canRemove: boolean
}> = ({ text, onChange, onRemove, canRemove }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl backdrop-blur-sm bg-white/40 border border-white/20">
    <div className="p-1 rounded-full bg-green-100/60">
      <Check className="h-4 w-4 text-green-600" />
    </div>
    <Input
      value={text}
      onChange={(e) => onChange(e.target.value)}
      className="flex-grow text-sm bg-white/60 border-white/30 rounded-lg"
      placeholder="Amenity description"
    />
    <Button
      variant="ghost"
      size="sm"
      onClick={onRemove}
      className="p-2 h-9 w-9 rounded-lg hover:bg-red-100/60 transition-colors"
      disabled={!canRemove}
    >
      <Trash className="h-4 w-4 text-red-500" />
    </Button>
  </div>
)

// Policy Detail Input Component
const PolicyDetailInputComponent: React.FC<{
  title: string
  content: string
  listItems: string[]
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
  onListItemsChange: (value: string[]) => void
  onRemove: () => void
  canRemove: boolean
  index: number
}> = ({ title, content, listItems, onTitleChange, onContentChange, onListItemsChange, onRemove, canRemove, index }) => {
  const listItemsText = listItems.join(", ")

  return (
    <div className="p-4 rounded-2xl backdrop-blur-sm bg-gradient-to-br from-white/50 to-white/30 border border-white/20 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-gray-800 bg-gray-100/60 px-3 py-1 rounded-full">Detail #{index + 1}</h3>
        {canRemove && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onRemove}
            className="rounded-xl bg-red-500/80 hover:bg-red-600/80 backdrop-blur-sm"
          >
            <Trash className="h-4 w-4 mr-1" /> Remove
          </Button>
        )}
      </div>

      <FormField
        label="Title"
        id={`detail-title-${index}`}
        value={title}
        onChange={onTitleChange}
        placeholder="Enter title"
      />

      <FormField
        label="Content"
        id={`detail-content-${index}`}
        value={content}
        onChange={onContentChange}
        placeholder="Enter content"
        multiline={true}
      />

      <div className="space-y-2">
        <Label htmlFor={`detail-list-${index}`} className="text-sm font-semibold text-gray-800">
          List Items (comma-separated)
        </Label>
        <Textarea
          id={`detail-list-${index}`}
          value={listItemsText}
          onChange={(e) => {
            const items = e.target.value
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item.length > 0)
            onListItemsChange(items)
          }}
          placeholder="Item 1, Item 2, Item 3"
          className="backdrop-blur-sm bg-white/60 border-white/30 rounded-xl focus:bg-white/80 transition-all duration-200"
          rows={2}
        />
        <p className="text-xs text-gray-500 font-medium">Enter multiple items separated by commas</p>
      </div>
    </div>
  )
}

// New Price Card Form Component
export const NewCardForm: React.FC<{
  formData: PriceCardInput
  updateField: (field: keyof PriceCardInput, value: string | PriceInput[] | AmenityInput[] | undefined) => void
  addPrice: () => void
  updatePrice: (index: number, field: keyof PriceInput, value: string) => void
  removePrice: (index: number) => void
  addAmenity: () => void
  updateAmenity: (index: number, value: string) => void
  removeAmenity: (index: number) => void
}> = ({ formData, updateField, addPrice, updatePrice, removePrice, addAmenity, updateAmenity, removeAmenity }) => (
  <div className="space-y-6 py-4">
    {/* Card Details */}
    <div className="space-y-4 p-4 rounded-2xl backdrop-blur-sm bg-gradient-to-br from-blue-50/60 to-cyan-50/40 border border-white/20">
      <h3 className="text-lg font-bold text-gray-800 mb-3">Card Information</h3>
      <FormField
        label="Title"
        id="new-title"
        value={formData.title}
        onChange={(value) => updateField("title", value)}
        placeholder="Price card title"
      />

      <FormField
        label="Description"
        id="new-desc"
        value={formData.description}
        onChange={(value) => updateField("description", value)}
        placeholder="Description here"
        multiline={true}
      />
    </div>

    {/* Prices */}
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-lg font-bold text-gray-800">Prices</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={addPrice}
          className="rounded-xl backdrop-blur-sm bg-white/60 border-white/30 hover:bg-white/80"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Price
        </Button>
      </div>
      <div className="space-y-3">
        {formData.prices.map((price, index) => (
          <PriceInputComponent
            key={index}
            label={price.label}
            value={price.value}
            onLabelChange={(value) => updatePrice(index, "label", value)}
            onValueChange={(value) => updatePrice(index, "value", value)}
            onRemove={() => removePrice(index)}
            canRemove={formData.prices.length > 1}
          />
        ))}
      </div>
    </div>

    {/* Amenities */}
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-lg font-bold text-gray-800">Amenities</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={addAmenity}
          className="rounded-xl backdrop-blur-sm bg-white/60 border-white/30 hover:bg-white/80"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Amenity
        </Button>
      </div>
      <div className="space-y-3">
        {formData.amenities.map((amenity, index) => (
          <AmenityInputComponent
            key={index}
            text={amenity.text}
            onChange={(value) => updateAmenity(index, value)}
            onRemove={() => removeAmenity(index)}
            canRemove={formData.amenities.length > 1}
          />
        ))}
      </div>
    </div>
  </div>
)

// New Policy Form Component
export const NewPolicyForm: React.FC<{
  formData: PolicyInput
  updateField: (field: keyof PolicyInput, value: string | PolicyDetailInput[]) => void
  addDetail: () => void
  updateDetail: (index: number, field: keyof PolicyDetailInput, value: string | string[]) => void
  removeDetail: (index: number) => void
}> = ({ formData, updateField, addDetail, updateDetail, removeDetail }) => (
  <div className="space-y-6 py-4">
    {/* Policy Details */}
    <div className="space-y-4 p-4 rounded-2xl backdrop-blur-sm bg-gradient-to-br from-purple-50/60 to-pink-50/40 border border-white/20">
      <h3 className="text-lg font-bold text-gray-800 mb-3">Policy Information</h3>
      <FormField
        label="Name"
        id="new-name"
        value={formData.name}
        onChange={(value) => updateField("name", value)}
        placeholder="Policy Name"
      />

      <FormField
        label="Description"
        id="new-desc"
        value={formData.description}
        onChange={(value) => updateField("description", value)}
        placeholder="Description here"
        multiline={true}
      />
    </div>

    {/* Policy Details */}
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-lg font-bold text-gray-800">Policy Details</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={addDetail}
          className="rounded-xl backdrop-blur-sm bg-white/60 border-white/30 hover:bg-white/80"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Detail
        </Button>
      </div>

      <div className="space-y-4">
        {formData.details.map((detail, index) => (
          <PolicyDetailInputComponent
            key={index}
            index={index}
            title={detail.title}
            content={detail.content}
            listItems={detail.listItems}
            onTitleChange={(value) => updateDetail(index, "title", value)}
            onContentChange={(value) => updateDetail(index, "content", value)}
            onListItemsChange={(value) => updateDetail(index, "listItems", value)}
            onRemove={() => removeDetail(index)}
            canRemove={formData.details.length > 1}
          />
        ))}
      </div>
    </div>
  </div>
)

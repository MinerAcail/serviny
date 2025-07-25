"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type ServiceProvider = {
  id: string
  name: string
  email: string
  phone: string
  subdomain: string
  status: "Active" | "Inactive" | "Pending"
  otherDetails: string
}

type ServiceProviderFormProps = {
  provider: ServiceProvider
  onSave: (updatedProvider: ServiceProvider) => void
}

export function ServiceProviderForm({ provider, onSave }: ServiceProviderFormProps) {
  const [formData, setFormData] = useState<ServiceProvider>(provider)

  useEffect(() => {
    setFormData(provider)
  }, [provider])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, status: value as "Active" | "Inactive" | "Pending" }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">
          Name
        </Label>
        <Input id="name" value={formData.name} onChange={handleChange} className="col-span-3" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
        <Label htmlFor="email" className="text-right">
          Email
        </Label>
        <Input id="email" type="email" value={formData.email} onChange={handleChange} className="col-span-3" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
        <Label htmlFor="phone" className="text-right">
          Phone
        </Label>
        <Input id="phone" value={formData.phone} onChange={handleChange} className="col-span-3" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
        <Label htmlFor="password" className="text-right">
          Password
        </Label>
        <Input id="password" type="password" placeholder="Leave blank to keep current" className="col-span-3" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
        <Label htmlFor="subdomain" className="text-right">
          Subdomain
        </Label>
        <div className="col-span-3 flex items-center">
          <Input id="subdomain" value={formData.subdomain} onChange={handleChange} className="flex-1" />
          <span className="ml-2 text-sm text-muted-foreground">.yourdomain.com</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
        <Label htmlFor="status" className="text-right">
          Status
        </Label>
        <Select onValueChange={handleSelectChange} value={formData.status}>
          <SelectTrigger id="status" className="col-span-3">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
        <Label htmlFor="otherDetails" className="text-right">
          Other Details
        </Label>
        <Textarea
          id="otherDetails"
          value={formData.otherDetails}
          onChange={handleChange}
          className="col-span-3 min-h-[80px]"
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit">Save changes</Button>
      </div>
    </form>
  )
}

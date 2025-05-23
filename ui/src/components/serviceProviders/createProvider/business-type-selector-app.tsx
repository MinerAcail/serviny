"use client"

import { useState } from "react"
import BusinessTypeSelector from "./business-type-selector"
// import BusinessTypeDetails from "./business-type-details"
import { Button } from "@/components/ui/button"
import BusinessTypeDetails from "./business-type-details"

export default function BusinessType() {
  const [businessType, setBusinessType] = useState<string | null>(null)


  const handleBusinessTypeSelect = (type: string) => {
    setBusinessType(type)
   
  }



  return (
    <div className="max-w-md mx-auto p-6 space-y-6">


      <BusinessTypeSelector onSelect={handleBusinessTypeSelect} />

    

 
    </div>
  )
}

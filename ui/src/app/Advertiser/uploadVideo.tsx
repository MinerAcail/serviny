"use client"

import type React from "react"
import { useState } from "react"
import { Download, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

export function VideoUploader() {
  const [videoUploaded, setVideoUploaded] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [processed, setProcessed] = useState(false)
  const [selectedPromoCode, setSelectedPromoCode] = useState("SUMMER25")

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setVideoUploaded(true)
      // Simulate processing
      setProcessing(true)
      setTimeout(() => {
        setProcessing(false)
        setProcessed(true)
        toast.success("Video processed successfully", {
          description: "Your video has been processed and is ready for download.",
        })
      }, 2000)
    }
  }

  const handleDownload = () => {
    toast.success("Download started", {
      description: "Your branded video is being downloaded.",
    })
  }

  return (
    <div className="space-y-4">
      {!videoUploaded ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="promo-code-select">Select Promo Code</Label>
            <Select defaultValue={selectedPromoCode} onValueChange={setSelectedPromoCode}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a promo code" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SUMMER25">SUMMER25 - 25% Off</SelectItem>
                <SelectItem value="WELCOME10">WELCOME10 - 10% Off</SelectItem>
                <SelectItem value="FREESHIP">FREESHIP - Free Shipping</SelectItem>
                <SelectItem value="FLASH50">FLASH50 - 50% Off</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              This promo code will be added to your video
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-upload">Upload Video (Max 1 minute)</Label>
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-4 sm:p-6">
              <div className="flex flex-col items-center justify-center gap-1 text-center">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <p className="text-sm font-medium">Drop your video here</p>
                <p className="text-xs text-muted-foreground">MP4, MOV (Max 100MB)</p>
              </div>
              <Input
                id="video-upload"
                type="file"
                accept="video/mp4,video/mov"
                className="hidden"
                onChange={handleVideoUpload}
              />
              <Button
                variant="outline"
                onClick={() => document.getElementById("video-upload")?.click()}
                className="w-full sm:w-auto"
                size="sm"
              >
                <Upload className="mr-2 h-4 w-4" />
                Select Video
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="aspect-video rounded-lg bg-muted flex items-center justify-center overflow-hidden relative">
            {processing ? (
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="h-6 w-6 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                <p className="text-sm font-medium">Processing...</p>
                <p className="text-xs text-muted-foreground">Please wait</p>
              </div>
            ) : (
              <>
                <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded-full">
                  <p className="text-xs text-white font-mono">{selectedPromoCode}</p>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/70 p-1 rounded-full">
                  <img
                    src="/placeholder.svg?height=24&width=24"
                    width="24"
                    height="24"
                    className="rounded-full"
                    alt="Logo"
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Video Preview</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedPromoCode} and logo added
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setVideoUploaded(false)
                setProcessed(false)
              }}
            >
              Upload Another
            </Button>
            <Button 
              size="sm"
              className="w-full" 
              onClick={handleDownload} 
              disabled={processing || !processed}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Video
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
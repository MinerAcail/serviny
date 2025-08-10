"use client"

import React, { useState, useRef } from "react"
import { useMutation, gql } from "@apollo/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, X, Play, Image, FileVideo, AlertCircle } from "lucide-react"

// GraphQL Mutations
const VIDEO_IMAGE_UPLOAD_MUTATION = gql`
  mutation VideoImageUpload($file: Upload!, $coverImage: Upload, $input: VideoImageInput!) {
    videoImageUpload(file: $file, coverImage: $coverImage, input: $input) {
      id
      name
      description
      url
      type
      coverImageUrl
      createdAt
    }
  }
`

const GET_UPLOADED_IMAGE_VIDEOS = gql`
  query GetUploadedImageVideos {
    getUploadedImageVideos {
      id
      name
      description
      url
      type
      coverImageUrl
      createdAt
    }
  }
`

interface FileWithPreview extends File {
  preview?: string
}

interface VideoImageInput {
  name: string
  description?: string
}

// Video/Image Upload Component
export function VideoImageUpload() {
  const [fileName, setFileName] = useState("")
  const [description, setDescription] = useState("")
  const [mainFile, setMainFile] = useState<FileWithPreview | null>(null)
  const [coverImage, setCoverImage] = useState<FileWithPreview | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errors, setErrors] = useState<string[]>([])

  const mainFileInputRef = useRef<HTMLInputElement>(null)
  const coverImageInputRef = useRef<HTMLInputElement>(null)

  const [videoImageUpload, { loading: uploading }] = useMutation(VIDEO_IMAGE_UPLOAD_MUTATION, {
    refetchQueries: [{ query: GET_UPLOADED_IMAGE_VIDEOS }],
    onCompleted: () => {
      // Reset form
      setFileName("")
      setDescription("")
      setMainFile(null)
      setCoverImage(null)
      setErrors([])
      setUploadProgress(0)
    },
    onError: (error) => {
      setErrors([error.message])
    }
  })

  const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB in bytes

  const validateFile = (file: File, type: "main" | "cover"): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than 50MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
    }

    if (type === "main") {
      const validTypes = [
        // Video types
        "video/mp4", "video/webm", "video/ogg", "video/avi", "video/mov",
        // Image types
        "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"
      ]
      if (!validTypes.includes(file.type)) {
        return "Please select a valid video file (MP4, WebM, OGG, AVI, MOV) or image file (JPEG, PNG, WebP, GIF)"
      }
    } else {
      const validImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
      if (!validImageTypes.includes(file.type)) {
        return "Cover image must be a valid image file (JPEG, PNG, WebP, GIF)"
      }
    }

    return null
  }

  const isVideoFile = (file: File): boolean => {
    return file.type.startsWith('video/')
  }

  const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/')
  }

  const handleMainFileUpload = (file: File) => {
    const error = validateFile(file, "main")
    if (error) {
      setErrors((prev) => [...prev, error])
      return
    }

    const fileWithPreview = Object.assign(file, {
      preview: URL.createObjectURL(file),
    })
    setMainFile(fileWithPreview)
    setErrors((prev) => prev.filter((err) => !err.includes("main") && !err.includes("valid")))

    // If uploading an image, clear cover image since it's not needed
    if (isImageFile(file) && coverImage) {
      if (coverImage.preview) {
        URL.revokeObjectURL(coverImage.preview)
      }
      setCoverImage(null)
    }
  }

  const handleCoverImageUpload = (file: File) => {
    const error = validateFile(file, "cover")
    if (error) {
      setErrors((prev) => [...prev, error])
      return
    }

    const fileWithPreview = Object.assign(file, {
      preview: URL.createObjectURL(file),
    })
    setCoverImage(fileWithPreview)
    setErrors((prev) => prev.filter((err) => !err.includes("Cover")))
  }

  const handleDrop = (e: React.DragEvent, type: "main" | "cover") => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      if (type === "main") {
        handleMainFileUpload(files[0])
      } else {
        handleCoverImageUpload(files[0])
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const removeFile = (type: "main" | "cover") => {
    if (type === "main") {
      if (mainFile?.preview) {
        URL.revokeObjectURL(mainFile.preview)
      }
      setMainFile(null)
    } else {
      if (coverImage?.preview) {
        URL.revokeObjectURL(coverImage.preview)
      }
      setCoverImage(null)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: string[] = []

    if (!fileName.trim()) {
      newErrors.push("File name is required")
    }

    if (!mainFile) {
      newErrors.push("Please select a file to upload")
    }

    if (newErrors.length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      // Prepare input
      const input: VideoImageInput = {
        name: fileName,
        description: description || undefined
      }

      // Start upload with progress simulation
      setUploadProgress(10)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      await videoImageUpload({
        variables: {
          file: mainFile,
          coverImage: coverImage || undefined,
          input
        }
      })

      clearInterval(progressInterval)
      setUploadProgress(100)
      
      // Reset progress after a short delay
      setTimeout(() => {
        setUploadProgress(0)
      }, 1000)

    } catch (error) {
      console.error("Upload error:", error)
    }
  }

  const clearErrors = () => {
    setErrors([])
  }

  const showCoverImageUpload = mainFile && isVideoFile(mainFile)

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Upload Video or Image</h1>
        <p className="text-muted-foreground">Upload your video/image content (max 50MB each)</p>
      </div>

      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {errors.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
            <Button variant="ghost" size="sm" onClick={clearErrors} className="mt-2 h-6 px-2">
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Details Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileVideo className="h-5 w-5" />
              File Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fileName">File Name *</Label>
              <Input
                id="fileName"
                type="text"
                placeholder="Enter file name..."
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                type="text"
                placeholder="Enter file description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Main File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Video or Image File *
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!mainFile ? (
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                onDrop={(e) => handleDrop(e, "main")}
                onDragOver={handleDragOver}
                onClick={() => mainFileInputRef.current?.click()}
              >
                <div className="flex justify-center mb-4">
                  <FileVideo className="h-8 w-8 mr-2 text-muted-foreground" />
                  <Image className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium mb-2">Drop your file here</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Videos: MP4, WebM, OGG, AVI, MOV | Images: JPEG, PNG, WebP, GIF
                </p>
                <p className="text-xs text-muted-foreground">Maximum file size: 50MB</p>
                <input
                  ref={mainFileInputRef}
                  type="file"
                  accept="video/*,image/*"
                  onChange={(e) => e.target.files?.[0] && handleMainFileUpload(e.target.files[0])}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {isVideoFile(mainFile) ? (
                        <div className="relative">
                          <video src={mainFile.preview} className="w-16 h-16 object-cover rounded" muted />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded">
                            <Play className="h-4 w-4 text-white" />
                          </div>
                        </div>
                      ) : (
                        <img src={mainFile.preview} className="w-16 h-16 object-cover rounded" alt="Preview" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{mainFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(mainFile.size)} • {isVideoFile(mainFile) ? 'Video' : 'Image'}
                      </p>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeFile("main")}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cover Image Upload - Only show for videos */}
        {showCoverImageUpload && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Cover Image (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!coverImage ? (
                <div
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                  onDrop={(e) => handleDrop(e, "cover")}
                  onDragOver={handleDragOver}
                  onClick={() => coverImageInputRef.current?.click()}
                >
                  <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">Drop your cover image here</p>
                  <p className="text-sm text-muted-foreground mb-4">or click to browse (JPEG, PNG, WebP, GIF)</p>
                  <p className="text-xs text-muted-foreground">Maximum file size: 50MB</p>
                  <input
                    ref={coverImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleCoverImageUpload(e.target.files[0])}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <img
                        src={coverImage.preview}
                        alt="Cover preview"
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium">{coverImage.name}</p>
                        <p className="text-sm text-muted-foreground">{formatFileSize(coverImage.size)}</p>
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeFile("cover")}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upload Progress */}
        {(uploading || uploadProgress > 0) && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={uploading} className="min-w-32">
            {uploading ? "Uploading..." : "Upload File"}
          </Button>
        </div>
      </form>
    </div>
  )
}
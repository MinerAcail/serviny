
import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Download,
  ImageIcon,
  FileText,
  Video,
  Copy,

} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { toast } from "sonner"

// Sample marketing materials data
const marketingMaterials = [
  {
    id: 1,
    type: "image",
    title: "Product Showcase",
    description: "High-quality product image with dark background",
    thumbnail: "/placeholder.svg?height=200&width=300",
    downloadUrl: "#",
    format: "PNG",
    dimensions: "1200x800px",
    fileSize: "2.4MB",
    tags: ["product", "dark", "premium"],
    platforms: ["instagram", "facebook"],
  },
  {
    id: 2,
    type: "image",
    title: "Student Discount",
    description: "Promotional image highlighting student discounts",
    thumbnail: "/placeholder.svg?height=200&width=300",
    downloadUrl: "#",
    format: "PNG",
    dimensions: "1080x1080px",
    fileSize: "1.8MB",
    tags: ["promo", "discount", "student"],
    platforms: ["instagram", "facebook", "twitter"],
  },
  {
    id: 3,
    type: "post",
    title: "Back to School",
    description: "Ready-to-use post for back to school season",
    thumbnail: "/placeholder.svg?height=200&width=300",
    downloadUrl: "#",
    content:
      "Heading back to campus? Use my promo code [YOUR_CODE] for 15% off your first serviny order! Perfect for dorm essentials, study snacks, and more. #servinyCampus #StudentDeals",
    tags: ["back-to-school", "campaign", "seasonal"],
    platforms: ["instagram", "facebook", "twitter"],
  },
  {
    id: 4,
    type: "post",
    title: "Exam Week Kit",
    description: "Post template for exam period promotions",
    thumbnail: "/placeholder.svg?height=200&width=300",
    downloadUrl: "#",
    content:
      "Exam week survival mode: ON 📚☕️\nGet everything you need delivered straight to your dorm with serviny! Use my code [YOUR_CODE] for free delivery on orders over $25.\n#ExamWeek #StudentLife #servinyDelivery",
    tags: ["exams", "student life", "promotion"],
    platforms: ["instagram", "twitter"],
  },
  {
    id: 5,
    type: "video",
    title: "Promo Code Tutorial",
    description: "Tutorial video showing how to apply promo codes",
    thumbnail: "/placeholder.svg?height=200&width=300",
    downloadUrl: "#",
    duration: "0:45",
    format: "MP4",
    fileSize: "12MB",
    tags: ["tutorial", "how-to", "promo code"],
    platforms: ["instagram", "tiktok"],
  },
  {
    id: 6,
    type: "video",
    title: "Student Testimonial",
    description: "Video template for creating student testimonials",
    thumbnail: "/placeholder.svg?height=200&width=300",
    downloadUrl: "#",
    duration: "0:30",
    format: "MP4",
    fileSize: "8MB",
    tags: ["testimonial", "template", "student"],
    platforms: ["instagram", "tiktok", "facebook"],
  },
]

export function Materials() {
  const [searchTerm] = useState("")
  const [selectedType] = useState("all")
  const [selectedPlatform] = useState("all")

  // Filter materials based on search term, type, and platform
  const filteredMaterials = marketingMaterials.filter((material) => {
    const matchesSearch =
      material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = selectedType === "all" || material.type === selectedType

    const matchesPlatform =
      selectedPlatform === "all" || (material.platforms && material.platforms.includes(selectedPlatform))

    return matchesSearch && matchesType && matchesPlatform
  })



const renderTypeIcon = (type: string): JSX.Element => {
    switch (type) {
        case "image":
            return <ImageIcon className="h-4 w-4" />;
        case "post":
            return <FileText className="h-4 w-4" />;
        case "video":
            return <Video className="h-4 w-4" />;
        default:
            return <FileText className="h-4 w-4" />;
    }
};



  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Marketing Materials</CardTitle>
          <CardDescription className="hidden sm:block">
            Download ready-to-use content for your social media
          </CardDescription>
        </CardHeader>
        <CardContent>
       
       

          {filteredMaterials.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No materials found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredMaterials.map((material) => (
                <Card key={material.id} className="overflow-hidden flex flex-col h-full shadow-sm">
                  <div className="aspect-video relative bg-muted">
                    <img
                      src={material.thumbnail || "/placeholder.svg"}
                      alt={material.title}
                      className="object-cover w-full h-full"
                    />
                    <Badge className="absolute top-2 right-2 flex items-center gap-1 text-xs px-2 py-1">
                      {renderTypeIcon(material.type)}
                      <span className="capitalize">{material.type}</span>
                    </Badge>
                  </div>
                  <CardHeader className="p-3 pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-base truncate">{material.title}</CardTitle>
                    </div>
                    <CardDescription className="line-clamp-1 text-xs">
                      {material.description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="p-3 pt-1 flex justify-between items-center mt-auto">
                    <div className="flex flex-col">
                      <div className="flex flex-wrap gap-1 mb-1">
                        {material.tags.slice(0, 2).map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))}
                        {material.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            +{material.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                      {/* {renderPlatformIcons(material.platforms)} */}
                    </div>

                    {material.type === "post" ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 px-3">
                            <FileText className="mr-1 h-4 w-4" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>{material.title}</DialogTitle>
                            <DialogDescription>{material.description}</DialogDescription>
                          </DialogHeader>
                          <div className="bg-muted p-3 rounded-md my-3">
                            <p className="whitespace-pre-line text-sm">{material.content}</p>
                          </div>
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // navigator.clipboard.writeText(material.content)
                                toast.success("Copied to clipboard")
                              }}
                            >
                              <Copy className="mr-1 h-4 w-4" />
                              Copy Text
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <Button variant="outline" size="sm" className="h-8 px-3">
                        <Download className="mr-1 h-4 w-4" />
                        <span className="sm:block hidden">Download</span>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Need Custom Materials?</CardTitle>
          <CardDescription>Request custom marketing materials for special promotions</CardDescription>
        </CardHeader>
        <CardContent>
          <Button size="sm">Request Custom Materials</Button>
        </CardContent>
      </Card>
    </div>
  )
}
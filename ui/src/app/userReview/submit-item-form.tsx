import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation } from "@apollo/client"
import { gql } from "@apollo/client"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageUpload } from "./image-upload"
import { Home, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Link } from "react-router"

// GraphQL mutation for submitting a new item
const SUBMIT_ITEM = gql`
  mutation RequestItem($input: RequestInput!) {
    requestItem(input: $input) {
      id
      name
      categories
      description
      imageUrls
      state
      createdAt
    }
  }
`

const formSchema = z.object({
  name: z.string().min(2, { message: "Item name must be at least 2 characters." }),
  category: z.string().min(1, { message: "Please select a category." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  price: z.string().optional(),
})

export function SubmitItemForm() {
  const [imageFiles, setImageFiles] = useState<File[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      price: "",
    },
  })

  // Set up GraphQL mutation
  const [submitItemMutation, { loading: isSubmitting }] = useMutation(SUBMIT_ITEM, {
    onCompleted: () => {
      form.reset()
      setImageFiles([])
      toast.success("Success! Your item has been submitted successfully.")
    },
    onError: (error) => {
      console.error("Error submitting item:", error)
      toast.error("Submission Failed")
    }
  })

  const handleImageChange = (files: File[]) => {
    setImageFiles(files)
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Validate that at least one image is uploaded
    if (imageFiles.length === 0) {
      toast.error("Please upload at least one image.")
      return
    }
    
    await submitItemMutation({
      variables: {
        input: {
          name: values.name,
          category: values.category,
          description: values.description,
          price: values.price || undefined,
          images: imageFiles,
        }
      }
    })
  }

  return (
    <Card className="w-full p-3 m-3 bgcontainer max-w-2xl mx-auto">
      <CardHeader>
        <Link to={"/"} >
      <Button variant="outline" className="flex items-center gap-1">
            <Home className="h-4 w-4" />
            Home
          </Button>
</Link>
        <CardTitle>Submit New Item</CardTitle>

        <CardDescription>Fill out the form below to submit a new item for review.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter item name" {...field} className="w-full" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter price" {...field} className="w-full" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="clothing">Clothing</SelectItem>
                      <SelectItem value="books">Books</SelectItem>
                      <SelectItem value="home">Home & Garden</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the item" {...field} className="min-h-[100px]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div>
              <FormLabel>Images</FormLabel>
              <div className="mt-2">
                <ImageUpload 
                  onChange={handleImageChange}
                  maxFiles={3} 
                />
              </div>
              {imageFiles.length === 0 && (
                <p className="text-sm text-red-500 mt-1">Please upload at least one image.</p>
              )}
              <FormDescription>Upload up to 3 images of the item.</FormDescription>
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Item"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
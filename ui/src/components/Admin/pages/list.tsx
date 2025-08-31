import { useMutation, useQuery, gql } from "@apollo/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import {
  FileVideo,
  AlertCircle,
  Eye,
  Trash2,
  Image,
  Search,
  Copy,
  Check,
  Info,
} from "lucide-react";
import { getImageUrl } from "@/components/global/formatPrice";

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
`;

const DELETE_VIDEO_MUTATION = gql`
  mutation DeleteVideo($id: String!) {
    deleteVideo(id: $id) {
      success
      message
    }
  }
`;

interface VideoImage {
  id: string;
  name: string;
  description?: string;
  url: string;
  type: "IMAGE" | "VIDEO";
  coverImageUrl?: string;
  createdAt: string;
}

// Uploaded Files List Component
export function UploadedFilesList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_UPLOADED_IMAGE_VIDEOS);
  const [deleteVideo] = useMutation(DELETE_VIDEO_MUTATION, {
    refetchQueries: [{ query: GET_UPLOADED_IMAGE_VIDEOS }],
    onError: (error) => {
      console.error("Delete error:", error);
    },
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteVideo({ variables: { id } });
    } catch (error) {
      console.error("Failed to delete file:", error);
    }
  };

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000); // Reset after 2 seconds
    } catch (error) {
      console.error("Failed to copy URL:", error);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter files based on search query
  const filterFiles = (files: VideoImage[]) => {
    if (!searchQuery.trim()) return files;

    const query = searchQuery.toLowerCase();
    return files.filter(
      (file) =>
        file.name.toLowerCase().includes(query) ||
        file.description?.toLowerCase().includes(query) ||
        file.type.toLowerCase().includes(query)
    );
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading files...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load files: {error.message}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="mt-2 h-6 px-2"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const allFiles = data?.getUploadedImageVideos || [];
  const filteredFiles = filterFiles(allFiles);
  const videos = filteredFiles.filter(
    (file: VideoImage) => file.type === "VIDEO"
  );
  const images = filteredFiles.filter(
    (file: VideoImage) => file.type === "IMAGE"
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Uploaded Files</h1>
          <p className="text-muted-foreground">
            {searchQuery ? (
              <>
                Showing {filteredFiles.length} of {allFiles.length} file(s) (
                {videos.length} videos, {images.length} images)
              </>
            ) : (
              <>
                {allFiles.length} file(s) uploaded ({videos.length} videos,{" "}
                {images.length} images)
              </>
            )}
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search files by name, description, or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileVideo className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery
                  ? "No files match your search"
                  : "No files uploaded yet"}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery ? (
                  <>
                    Try adjusting your search terms or{" "}
                    <button
                      onClick={() => setSearchQuery("")}
                      className="text-primary hover:underline"
                    >
                      clear the search
                    </button>
                  </>
                ) : (
                  "Upload your first video or image to see it here"
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredFiles.map((file: VideoImage) => (
            <Card key={file.id} className="overflow-hidden">
              {/* Thumbnail Section - Smaller */}
              <div className="relative">
                {file.type === "VIDEO" ? (
                  // Video thumbnail
                  file.coverImageUrl ? (
                    <img
                      src={getImageUrl(file.coverImageUrl)}
                      alt={file.name}
                      className="w-full h-32 object-cover"
                    />
                  ) : (
                    <div className="w-full h-32 bg-muted flex items-center justify-center">
                      <FileVideo className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )
                ) : (
                  // Image thumbnail
                  <img
                    src={getImageUrl(file.url)}
                    alt={file.name}
                    className="w-full h-32 object-cover"
                  />
                )}

                {/* File type badge */}
                <div className="absolute top-2 left-2">
                  <div className="bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                    {file.type === "VIDEO" ? (
                      <FileVideo className="h-3 w-3" />
                    ) : (
                      <Image className="h-3 w-3" />
                    )}
                    {file.type}
                  </div>
                </div>

                {/* Hover overlay with actions */}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => window.open(file.url, "_blank")}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete File</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{file.name}"? This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(file.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>

              {/* Content Section - Compact */}
              <CardContent className="p-3">
                <div className="space-y-2">
                  <h3
                    className="font-medium text-sm line-clamp-1"
                    title={file.name}
                  >
                    {file.name}
                  </h3>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(file.createdAt)}
                  </div>

                  {/* Accordion for Details */}
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="details" className="border-0">
                      <AccordionTrigger className="py-2 text-xs font-medium hover:no-underline">
                        <div className="flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          Details
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        <div className="space-y-3">
                          {/* Description */}
                          {file.description && (
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">
                                Description:
                              </label>
                              <p className="text-xs mt-1">{file.description}</p>
                            </div>
                          )}

                          {/* URL Input with Copy Button */}
                          <div>
                            <label className="text-xs font-medium text-muted-foreground">
                              File URL:
                            </label>
                            <div className="flex gap-1 mt-1">
                              <Input
                                value={file.url}
                                readOnly
                                className="text-xs font-mono h-8"
                                onClick={(e) => e.currentTarget.select()}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCopyUrl(file.url)}
                                className="px-2 h-8"
                              >
                                {copiedUrl === file.url ? (
                                  <Check className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                          {file.coverImageUrl && (
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">
                                cover URL:
                              </label>
                              <div className="flex gap-1 mt-1">
                                <Input
                                  value={file.coverImageUrl}
                                  readOnly
                                  className="text-xs font-mono h-8"
                                  onClick={(e) => e.currentTarget.select()}
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleCopyUrl(file.coverImageUrl ?? "")
                                  }
                                  className="px-2 h-8"
                                >
                                  {copiedUrl === file.coverImageUrl ? (
                                    <Check className="h-3 w-3 text-green-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                          {/* Quick Actions */}
                          <div className="flex gap-1 pt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(file.url, "_blank")}
                              className="flex-1 h-7 text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="flex-1 h-7 text-xs"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete File
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{file.name}
                                    "? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(file.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

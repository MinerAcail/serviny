import { Link } from "react-router";
import {
  FileText,
  ExternalLink,
  RefreshCw,
  Share2,
} from "lucide-react";
import { gql, useQuery } from "@apollo/client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { toast } from "sonner";

// GraphQL queries and mutations
const GET_FORMS = gql`
  query GetForms($serviceId: String!) {
    getForms(serviceId: $serviceId) {
      id
      title
      description
      type
      createdAt
      updatedAt
      isActive
      submissionCount
      fields {
        id
        type
        label
        required
      }
    }
  }
`;


type FormsPageProps = { serviceId: string };

export default function FormsPagePolicies({ serviceId }: FormsPageProps) {
  // GraphQL hooks
  const { data, loading, error, refetch } = useQuery(GET_FORMS, {
    variables: {
      serviceId: serviceId,
    },
    errorPolicy: "all",
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFormTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      AGREEMENT: "bg-blue-50 text-blue-600",
      SURVEY: "bg-green-50 text-green-600",
      APPLICATION: "bg-purple-50 text-purple-600",
      FEEDBACK: "bg-orange-50 text-orange-600",
      RIDERS: "bg-yellow-50 text-yellow-600",
      WORKERS: "bg-pink-50 text-pink-600",
      OTHER: "bg-gray-50 text-gray-600",
      // Legacy lowercase types
      agreement: "bg-blue-50 text-blue-600",
      survey: "bg-green-50 text-green-600",
      application: "bg-purple-50 text-purple-600",
      feedback: "bg-orange-50 text-orange-600",
      riders: "bg-yellow-50 text-yellow-600",
      workers: "bg-pink-50 text-pink-600",
      other: "bg-gray-50 text-gray-600",
    };
    return colors[type] ?? colors.OTHER;
  };

  // Generate shareable link for form
  const generateFormShareableLink = (form: any) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/view/${form.id}`;
  };

  // Share form handler - uses native system share
  const shareForm = async (form: any) => {
    const shareUrl = generateFormShareableLink(form);
    const shareData = {
      title: form.title,
      text: form.description || "Service Form",
      url: shareUrl,
    };

    try {
      // Check if native sharing is supported
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare(shareData)
      ) {
        await navigator.share(shareData);
      } else {
        // Fallback to copying link to clipboard
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard!");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        // User didn't cancel, show fallback
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast.success("Link copied to clipboard!");
        } catch (clipboardErr) {
          toast.error("Failed to share or copy link");
        }
      }
    }
  };

  // Get forms data
  const forms = data?.getForms || [];
  const isLoading = loading;
  const hasError = error && !data?.getForms;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7]">
        <div className="container mx-auto px-6 py-16">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-500 font-medium">Loading forms...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="container mx-auto px-6 py-1">
        {hasError && (
          <div className="bg-white backdrop-blur-md bg-opacity-70 border border-red-100 rounded-2xl p-5 mb-8 shadow-sm">
            <div className="flex items-center">
              <div className="bg-red-50 rounded-full p-2 mr-4">
                <svg
                  className="h-5 w-5 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Failed to load forms
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Unable to connect to the server. Please try again.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="ml-auto border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </div>
        )}

        {forms.length === 0 ? (
          <div className="bg-white backdrop-blur-md bg-opacity-80 rounded-2xl shadow-sm border border-gray-100 text-center py-20 px-6">
            <div className="flex flex-col items-center gap-5">
              <div className="bg-[#F5F5F7] rounded-full p-5">
                <FileText className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-medium text-gray-900">
                No forms added yet
              </h3>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form: any) => (
              <Card
                key={form.id}
                className="bg-white backdrop-blur-md bg-opacity-80 border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                <CardHeader className="pb-1 border-b border-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-medium text-gray-900 truncate">
                        {form.title}
                      </CardTitle>
                      <div className="mt-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFormTypeColor(
                            form.type
                          )}`}
                        >
                          {form.type.charAt(0).toUpperCase() +
                            form.type.slice(1).toLowerCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="py-4">
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {form.description || "No description provided"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-4">
                    <span>Created {formatDate(form.createdAt)}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span>
                      {form.fields?.length || 0} field
                      {(form.fields?.length || 0) !== 1 ? "s" : ""}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2 pt-0 border-t border-gray-50">
                  <Button
                    variant="outline"
                    asChild
                    className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl"
                  >
                    <Link to={`/view/${form.id}`}>
                      <ExternalLink className="mr-2 h-4 w-4" /> View
                    </Link>
                  </Button>
                  <Button
                    onClick={() => shareForm(form)}
                    className="flex-1 flex items-center justify-center gap-1 rounded-xl"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

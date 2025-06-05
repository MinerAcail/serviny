"use client";

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  PlusCircle,
  FileText,
  ExternalLink,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { gql, useQuery, useMutation } from "@apollo/client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// GraphQL queries and mutations
const GET_FORMS = gql`
  query GetForms(
    $filter: FormsFilter
    $limit: Int
    $offset: Int
    $orderBy: String
    $orderDirection: String
  ) {
    forms(
      filter: $filter
      limit: $limit
      offset: $offset
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
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

const DELETE_FORM = gql`
  mutation DeleteForm($id: ID!) {
    deleteForm(id: $id)
  }
`;

export default function FormsPage() {
  const [formToDelete, setFormToDelete] = useState(null);

  // GraphQL hooks
  const { data, loading, error, refetch } = useQuery(GET_FORMS, {
    variables: {
      filter: { isActive: true },
      limit: 50,
      offset: 0,
      orderBy: "createdAt",
      orderDirection: "DESC",
    },
    errorPolicy: "all",
  });

  const [deleteFormMutation] = useMutation(DELETE_FORM, {
    onCompleted: () => {
      toast.success("Form deleted", {
        description: "The form has been deleted successfully.",
      });
      refetch(); // Refresh the forms list
    },
    onError: (error) => {
      toast.error("Failed to delete form", {
        description: error.message,
      });
    },
  });

  const deleteForm = async (id: string) => {
    try {
      await deleteFormMutation({
        variables: { id },
      });
    } catch (error) {
      console.error("Delete form error:", error);
      toast.error("Failed to delete form", {
        description: "Please try again.",
      });
    } finally {
      setFormToDelete(null);
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

  const getFormTypeColor = (type: string) => {
    const colors = {
      AGREEMENT: "bg-blue-100 text-blue-800",
      SURVEY: "bg-green-100 text-green-800",
      APPLICATION: "bg-purple-100 text-purple-800",
      FEEDBACK: "bg-orange-100 text-orange-800",
      OTHER: "bg-gray-100 text-gray-800",
      // Legacy lowercase types
      agreement: "bg-blue-100 text-blue-800",
      survey: "bg-green-100 text-green-800",
      application: "bg-purple-100 text-purple-800",
      feedback: "bg-orange-100 text-orange-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[type] || colors.OTHER;
  };

  // Get forms data
  const forms = data?.forms || [];
  const isLoading = loading;
  const hasError = error && !data?.forms;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-6 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-semibold text-gray-900">
                  My Forms
                </h1>
                <p className="text-gray-600 mt-1">Manage your created forms</p>
              </div>
              <Button
                asChild
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Link to="/builder">
                  <PlusCircle className="mr-2 h-4 w-4" /> Create New Form
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 py-10">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading forms...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        {hasError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-red-600 mr-3"
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
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Failed to load forms
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  Unable to connect to the server. Please try again.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="ml-auto border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </div>
        )}

        {forms.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="bg-gray-100 rounded-full p-4">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900">
                No forms created yet
              </h3>
              <p className="text-gray-500 max-w-md">
                Create your first form to start collecting responses. You can
                build surveys, agreements, applications, and more.
              </p>
              <Button
                asChild
                className="bg-blue-600 hover:bg-blue-700 text-white mt-2"
              >
                <Link to="/builder">
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Form
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form: any) => (
              <Card
                key={form.id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-medium text-gray-900 truncate">
                        {form.title}
                      </CardTitle>
                      <CardDescription className="text-gray-500 mt-1">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getFormTypeColor(
                            form.type
                          )}`}
                        >
                          {form.type.charAt(0).toUpperCase() +
                            form.type.slice(1).toLowerCase()}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {form.description || "No description provided"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Created {formatDate(form.createdAt)}</span>
                    <span>•</span>
                    <span>
                      {form.fields?.length || 0} field
                      {(form.fields?.length || 0) !== 1 ? "s" : ""}
                    </span>
                    {form.submissionCount !== undefined && (
                      <>
                        <span>•</span>
                        <span>
                          {form.submissionCount} submission
                          {form.submissionCount !== 1 ? "s" : ""}
                        </span>
                      </>
                    )}
                    {!form.isActive && (
                      <>
                        <span>•</span>
                        <span className="text-red-500">Inactive</span>
                      </>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-0">
                  <Button
                    variant="outline"
                    asChild
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <Link to={`/view/${form.id}`}>
                      <ExternalLink className="mr-2 h-4 w-4" /> View Form
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFormToDelete(form)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!formToDelete}
        onOpenChange={(open) => !open && setFormToDelete(null)}
      >
        <AlertDialogContent className="bg-white rounded-2xl border-0 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-medium text-gray-900">
              Delete Form
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              This will permanently delete "{formToDelete?.title}". This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteForm(formToDelete?.id)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Form
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export  function FormsPageAtMain() {
  // GraphQL hooks
  const { data, loading, error, refetch } = useQuery(GET_FORMS, {
    variables: {
      filter: { isActive: true },
      limit: 50,
      offset: 0,
      orderBy: "createdAt",
      orderDirection: "DESC",
    },
    errorPolicy: "all",
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getFormTypeColor = (type: string) => {
    const colors = {
      AGREEMENT: "bg-blue-50 text-blue-600",
      SURVEY: "bg-green-50 text-green-600",
      APPLICATION: "bg-purple-50 text-purple-600",
      FEEDBACK: "bg-orange-50 text-orange-600",
      OTHER: "bg-gray-50 text-gray-600",
      // Legacy lowercase types
      agreement: "bg-blue-50 text-blue-600",
      survey: "bg-green-50 text-green-600",
      application: "bg-purple-50 text-purple-600",
      feedback: "bg-orange-50 text-orange-600",
      other: "bg-gray-50 text-gray-600",
    }
    return colors[type] || colors.OTHER
  }

  // Get forms data
  const forms = data?.forms || []
  const isLoading = loading
  const hasError = error && !data?.forms

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
    )
  }

  return (
    <div className="">
      <div className="container mx-auto px-6 py-1">

        {hasError && (
          <div className="bg-white backdrop-blur-md bg-opacity-70 border border-red-100 rounded-2xl p-5 mb-8 shadow-sm">
            <div className="flex items-center">
              <div className="bg-red-50 rounded-full p-2 mr-4">
                <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">Failed to load forms</h3>
                <p className="text-sm text-gray-600 mt-1">Unable to connect to the server. Please try again.</p>
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
              <h3 className="text-2xl font-medium text-gray-900">No forms added yet</h3>
            
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
                      <CardTitle className="text-lg font-medium text-gray-900 truncate">{form.title}</CardTitle>
                      <div className="mt-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFormTypeColor(
                            form.type,
                          )}`}
                        >
                          {form.type.charAt(0).toUpperCase() + form.type.slice(1).toLowerCase()}
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
                <CardFooter className="flex justify-between pt-0 border-t border-gray-50">
                  <Button
                    variant="outline"
                    asChild
                    className="w-full border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl"
                  >
                    <Link to={`/view/${form.id}`}>
                      <ExternalLink className="mr-2 h-4 w-4" /> View Form
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

import React, { useState } from "react";
import { Info, Plus, Trash, Save, Edit, Share2 } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery, useMutation, gql } from "@apollo/client";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import FormsPage, {
  FormsPageAtMain,
} from "@/components/user/formBuilder/FormsPage";
import FormsPagePolicies from "@/components/user/formBuilder/FormsPagePolicies";
import { useAuth, useProfileUpdate } from "@/middleware/context/authContext";
import { useCheckAuthId } from "@/middleware/context/checkID";

// GraphQL queries and mutations
const GET_POLICY_INFORMATION = gql`
  query GetPolicyInformation($ServiceID: String!) {
    getPolicyInformation(ServiceID: $ServiceID) {
      policy {
        id
        name
        description
        createdAt
      }
      policyDetails {
        id
        title
        content
        listItems
        createdAt
        updatedAt
      }
    }
  }
`;

const CREATE_POLICY = gql`
  mutation CreatePolicy($input: CreatePolicyInput!) {
    createPolicy(input: $input) {
      id
      name
      description
    }
  }
`;

const UPDATE_POLICY = gql`
  mutation UpdatePolicy($policyId: String!, $input: UpdatePolicyInput!) {
    updatePolicy(policyId: $policyId, input: $input) {
      id
      name
      description
    }
  }
`;

const DELETE_POLICY = gql`
  mutation DeletePolicy($policyId: String!) {
    deletePolicy(policyId: $policyId)
  }
`;

// Types based on GraphQL schema
interface Policy {
  id: string;
  name: string;
  description: string;
  createdAt: string | null;
}

interface PolicyDetail {
  id: string;
  title: string;
  content: string;
  listItems: string[] | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface FullPolicy {
  policy: Policy;
  policyDetails: PolicyDetail[];
}

interface PolicyDetailInput {
  title: string;
  content: string;
  listItems: string[];
}

interface PolicyInput {
  name: string;
  description: string;
  details: PolicyDetailInput[];
  ServiceId?: string;
}

// Component for individual form fields
const FormField: React.FC<{
  label: string;
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}> = ({ label, id, value, onChange, placeholder, multiline = false }) => (
  <div>
    <Label htmlFor={id}>{label}</Label>
    {multiline ? (
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mb-2"
        rows={3}
      />
    ) : (
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mb-2"
      />
    )}
  </div>
);

// PolicyDetail Input Component
const PolicyDetailInput: React.FC<{
  title: string;
  content: string;
  listItems: string[];
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onListItemsChange: (value: string[]) => void;
  onRemove: () => void;
  canRemove: boolean;
  index: number;
}> = ({
  title,
  content,
  listItems,
  onTitleChange,
  onContentChange,
  onListItemsChange,
  onRemove,
  canRemove,
  index,
}) => {
  // Join list items for display in textarea
  const listItemsText = listItems.join(", ");

  return (
    <div className="border p-4 rounded-md space-y-3 bg-muted/20">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Detail #{index + 1}</h3>
        {canRemove && (
          <Button variant="destructive" size="sm" onClick={onRemove}>
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

      <div>
        <Label htmlFor={`detail-list-${index}`}>
          List Items (comma-separated)
        </Label>
        <Textarea
          id={`detail-list-${index}`}
          value={listItemsText}
          onChange={(e) => {
            const items = e.target.value
              .split(",")
              .map((item) => item.trim())
              .filter((item) => item.length > 0);
            onListItemsChange(items);
          }}
          placeholder="Item 1, Item 2, Item 3"
          className="mb-2"
          rows={2}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Enter multiple items separated by commas
        </p>
      </div>
    </div>
  );
};

// Individual Policy Card Component

// Individual Policy Card Component with Share functionality
const PolicyCardItem: React.FC<{
  fullPolicy: FullPolicy;
  onEdit: (policy: FullPolicy) => void;
  onShare: (policy: FullPolicy) => void;
}> = ({ fullPolicy, onEdit, onShare }) => {
  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Parse list items for each policy detail
  const getPolicyListItems = (detail: PolicyDetail): string[] => {
    if (!detail.listItems) return [];

    try {
      return Array.isArray(detail.listItems)
        ? detail.listItems
        : typeof detail.listItems === "string"
        ? JSON.parse(detail.listItems)
        : [];
    } catch (e) {
      console.error("Error parsing policy list items:", e);
      return [];
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start gap-2">
          <div className="mt-1 p-1.5 rounded-full bg-primary/10">
            <Info className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{fullPolicy.policy.name}</CardTitle>
            <CardDescription>
              {fullPolicy.policy.description || "No description available."}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        {fullPolicy.policyDetails.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No details found for this policy.
          </p>
        ) : (
          <div className="space-y-6">
            {fullPolicy.policyDetails.map((detail) => {
              const policyItems = getPolicyListItems(detail);

              return (
                <div key={detail.id} className="space-y-2">
                  <h3 className="text-md font-semibold">{detail.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {detail.content}
                  </p>

                  {/* List items if available */}
                  {policyItems.length > 0 && (
                    <ul className="ml-5 list-disc text-sm space-y-1">
                      {policyItems.map((item, index) => (
                        <li key={index} className="text-muted-foreground">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Display the last update time */}
                  {detail.updatedAt && (
                    <div className="text-xs text-muted-foreground">
                      Last updated: {formatDate(detail.updatedAt)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <CardFooter className="mt-auto gap-2">
        <Button
          onClick={() => onEdit(fullPolicy)}
          className="flex-1 flex items-center justify-center gap-1"
          variant="outline"
        >
          <Edit className="h-4 w-4" /> Edit
        </Button>
        <Button
          onClick={() => onShare(fullPolicy)}
          className="flex-1 flex items-center justify-center gap-1"
        >
          <Share2 className="h-4 w-4" /> Share
        </Button>
      </CardFooter>
    </Card>
  );
};

// New Policy Form Component
const NewPolicyForm: React.FC<{
  formData: PolicyInput;
  updateField: (
    field: keyof PolicyInput,
    value: string | PolicyDetailInput[]
  ) => void;
  addDetail: () => void;
  updateDetail: (
    index: number,
    field: keyof PolicyDetailInput,
    value: string | string[]
  ) => void;
  removeDetail: (index: number) => void;
}> = ({ formData, updateField, addDetail, updateDetail, removeDetail }) => (
  <div className="space-y-4 py-4">
    {/* Policy Details */}
    <div className="space-y-3">
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
    <div>
      <div className="flex justify-between items-center mb-3">
        <Label className="block text-sm font-medium">Policy Details</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={addDetail}
          className="text-xs"
        >
          <Plus className="h-3 w-3 mr-1" /> Add Detail
        </Button>
      </div>

      <div className="space-y-4">
        {formData.details.map((detail, index) => (
          <PolicyDetailInput
            key={index}
            index={index}
            title={detail.title}
            content={detail.content}
            listItems={detail.listItems}
            onTitleChange={(value) => updateDetail(index, "title", value)}
            onContentChange={(value) => updateDetail(index, "content", value)}
            onListItemsChange={(value) =>
              updateDetail(index, "listItems", value)
            }
            onRemove={() => removeDetail(index)}
            canRemove={formData.details.length > 1}
          />
        ))}
      </div>
    </div>
  </div>
);

const Policies: React.FC = () => {
  // Get serviceId from URL params
    const { serviceId: updateServiceId } = useParams<{ serviceId: string }>();
  const { firstProfileId } = useProfileUpdate(updateServiceId);
  const { user } = useAuth();
      const localServiceId = localStorage.getItem("serviceId");

  const serviceId = firstProfileId ?? updateServiceId ?? localServiceId;
  const { isMatch } = useCheckAuthId(user?.id);

  const navigate = useNavigate();

  // Apollo query to fetch policies
  const { loading, error, data, refetch } = useQuery(GET_POLICY_INFORMATION, {
    variables: { ServiceID: serviceId },
    fetchPolicy: "network-only", // Don't use cache to ensure fresh data
  });

  // Apollo mutations
  const [createPolicy] = useMutation(CREATE_POLICY, {
    onCompleted: () => {
      toast.success("Policy created successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create policy: ${error.message}`);
    },
  });

  const [updatePolicy] = useMutation(UPDATE_POLICY, {
    onCompleted: () => {
      toast.success("Policy updated successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update policy: ${error.message}`);
    },
  });

  const [deletePolicy] = useMutation(DELETE_POLICY, {
    onCompleted: () => {
      toast.success("Policy deleted successfully!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete policy: ${error.message}`);
    },
  });

  // State for dialogs
  const [newPolicyDialogOpen, setNewPolicyDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<FullPolicy | null>(null);

  // State for new policy form
  const [newPolicyData, setNewPolicyData] = useState<PolicyInput>({
    name: "",
    description: "",
    details: [
      { title: "General", content: "Policy details here", listItems: [] },
    ],
  });

  // Get policies from query data
  const policies: FullPolicy[] = data?.getPolicyInformation || [];

  // Generate shareable link for policy
  const generatePolicyShareableLink = (policy: FullPolicy) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/service/${serviceId}/policy/${policy.policy.id}`;
  };

  // Share policy handler - uses native system share
  const sharePolicy = async (policy: FullPolicy) => {
    const shareUrl = generatePolicyShareableLink(policy);
    const shareData = {
      title: policy.policy.name,
      text: policy.policy.description || "Service Policy",
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

  // Edit policy - open dialog with policy data
  const editPolicy = (policy: FullPolicy) => {
    setEditingPolicy({ ...policy });
    setEditDialogOpen(true);
  };

  // Add new policy
  const addPolicy = () => {
    const input = {
      ...newPolicyData,
      // ServiceId: serviceId
    };

    createPolicy({
      variables: {
        input,
      },
    });

    // Reset form
    setNewPolicyData({
      name: "",
      description: "",
      details: [
        { title: "General", content: "Policy details here", listItems: [] },
      ],
    });
    setNewPolicyDialogOpen(false);
  };

  // Save edited policy
  const savePolicy = () => {
    if (!editingPolicy) return;

    const { policy, policyDetails } = editingPolicy;

    updatePolicy({
      variables: {
        policyId: policy.id,
        input: {
          name: policy.name,
          description: policy.description,
          details: policyDetails.map((detail) => ({
            id: detail.id,
            title: detail.title,
            content: detail.content,
            listItems: Array.isArray(detail.listItems)
              ? detail.listItems
              : detail.listItems
              ? JSON.parse(detail.listItems)
              : [],
          })),
        },
      },
    });

    setEditDialogOpen(false);
    setEditingPolicy(null);
  };

  // Remove policy
  const removePolicy = (policyId: string) => {
    deletePolicy({
      variables: {
        policyId,
      },
    });

    if (editingPolicy && editingPolicy.policy.id === policyId) {
      setEditDialogOpen(false);
      setEditingPolicy(null);
    }
  };

  // Form handlers for new policy
  const updateNewPolicyField = (
    field: keyof PolicyInput,
    value: string | PolicyDetailInput[]
  ) => {
    setNewPolicyData({ ...newPolicyData, [field]: value });
  };

  const addNewPolicyDetail = () => {
    updateNewPolicyField("details", [
      ...newPolicyData.details,
      { title: "New Section", content: "Policy details here", listItems: [] },
    ]);
  };

  const updateNewPolicyDetail = (
    index: number,
    field: keyof PolicyDetailInput,
    value: string | string[]
  ) => {
    const updatedDetails = [...newPolicyData.details];
    updatedDetails[index] = { ...updatedDetails[index], [field]: value };
    updateNewPolicyField("details", updatedDetails);
  };

  const removeNewPolicyDetail = (index: number) => {
    const updatedDetails = newPolicyData.details.filter((_, i) => i !== index);
    updateNewPolicyField("details", updatedDetails);
  };

  // Form handlers for editing policy
  const updateEditingPolicyField = (
    field: keyof FullPolicy,
    value: FullPolicy[keyof FullPolicy]
  ) => {
    if (!editingPolicy) return;
    setEditingPolicy({ ...editingPolicy, [field]: value });
  };

  const updateEditingPolicyProperty = (field: keyof Policy, value: string) => {
    if (!editingPolicy) return;
    const updatedPolicy = { ...editingPolicy.policy, [field]: value };
    updateEditingPolicyField("policy", updatedPolicy);
  };

  const addEditingPolicyDetail = () => {
    if (!editingPolicy) return;

    // Generate temporary ID for UI purposes
    const tempId = `temp-${Date.now()}`;

    updateEditingPolicyField("policyDetails", [
      ...editingPolicy.policyDetails,
      {
        id: tempId,
        title: "New Section",
        content: "Policy details here",
        listItems: [],
        createdAt: null,
        updatedAt: null,
      },
    ]);
  };

  const updateEditingPolicyDetail = (
    detailId: string,
    field: keyof PolicyDetail,
    value: string | string[]
  ) => {
    if (!editingPolicy) return;

    const updatedDetails = editingPolicy.policyDetails.map((detail) =>
      detail.id === detailId ? { ...detail, [field]: value } : detail
    );
    updateEditingPolicyField("policyDetails", updatedDetails);
  };

  const removeEditingPolicyDetail = (detailId: string) => {
    if (!editingPolicy) return;

    const updatedDetails = editingPolicy.policyDetails.filter(
      (detail) => detail.id !== detailId
    );
    updateEditingPolicyField("policyDetails", updatedDetails);
  };

  // Handle loading and error states
  if (loading) return <div>Loading policies...</div>;
  if (error) return <div>Error loading policies: {error.message}</div>;

  // Check if there are no policies
  const hasPolicies = policies.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold tracking-tight">Policies</h2>

        {/* Add New Policy Dialog Trigger */}
        <Dialog
          open={newPolicyDialogOpen}
          onOpenChange={setNewPolicyDialogOpen}
        >
          {isMatch && (

          <div className="flex gap-3">
            <DialogTrigger className="" asChild>
              <Button className="flex items-center justify-end gap-1">
                <Plus className="h-4 w-4" />
                New Policy
              </Button>
            </DialogTrigger>

            <Button
              onClick={() => {
                navigate("/dbp/builder");
              }}
              className="flex items-center justify-end gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Forms
            </Button>
          </div>

          )}
          <DialogContent className="sm:max-w-lg max-h-[90%] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Policy</DialogTitle>
              <DialogDescription>
                Fill in the details for your new policy
              </DialogDescription>
            </DialogHeader>

            <NewPolicyForm
              formData={newPolicyData}
              updateField={updateNewPolicyField}
              addDetail={addNewPolicyDetail}
              updateDetail={updateNewPolicyDetail}
              removeDetail={removeNewPolicyDetail}
            />

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setNewPolicyDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={addPolicy}>Create Policy</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Policy Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90%] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Policy</DialogTitle>
            <DialogDescription>
              Update details for this policy
            </DialogDescription>
          </DialogHeader>

          {editingPolicy && (
            <div className="space-y-4 py-4">
              {/* Policy Details */}
              <div className="space-y-3">
                <FormField
                  label="Name"
                  id="edit-name"
                  value={editingPolicy.policy.name}
                  onChange={(value) =>
                    updateEditingPolicyProperty("name", value)
                  }
                />

                <FormField
                  label="Description"
                  id="edit-desc"
                  value={editingPolicy.policy.description}
                  onChange={(value) =>
                    updateEditingPolicyProperty("description", value)
                  }
                  multiline={true}
                />
              </div>

              {/* Policy Details */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <Label className="block text-sm font-medium">
                    Policy Details
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addEditingPolicyDetail}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Detail
                  </Button>
                </div>

                <div className="space-y-4">
                  {editingPolicy.policyDetails.map((detail, index) => {
                    // Parse list items
                    const listItems = Array.isArray(detail.listItems)
                      ? detail.listItems
                      : detail.listItems
                      ? JSON.parse(detail.listItems)
                      : [];

                    return (
                      <PolicyDetailInput
                        key={detail.id}
                        index={index}
                        title={detail.title}
                        content={detail.content}
                        listItems={listItems}
                        onTitleChange={(value) =>
                          updateEditingPolicyDetail(detail.id, "title", value)
                        }
                        onContentChange={(value) =>
                          updateEditingPolicyDetail(detail.id, "content", value)
                        }
                        onListItemsChange={(value) =>
                          updateEditingPolicyDetail(
                            detail.id,
                            "listItems",
                            value
                          )
                        }
                        onRemove={() => removeEditingPolicyDetail(detail.id)}
                        canRemove={editingPolicy.policyDetails.length > 1}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-between sm:justify-end">
            <Button
              variant="destructive"
              onClick={() => {
                if (editingPolicy) removePolicy(editingPolicy.policy.id);
              }}
              className="mr-auto"
            >
              <Trash className="h-4 w-4 mr-1" /> Delete
            </Button>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={savePolicy}>
              <Save className="h-4 w-4 mr-1" /> Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FormsPagePolicies serviceId={serviceId ?? ""} />

      {/* No policies message */}
      {!hasPolicies && (
        <div className="text-center py-12 border rounded-lg bg-muted/20">
          <Info className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-medium mb-2">No Policies Yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first policy to provide guidelines for this service.
          </p>
          <Button
            onClick={() => setNewPolicyDialogOpen(true)}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" /> Create New Policy
          </Button>
        </div>
      )}

      {/* Policy cards grid */}
      {hasPolicies && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-auto">
          {policies.map((fullPolicy) => (
            <div key={fullPolicy.policy.id} className="h-full">
              <PolicyCardItem
                fullPolicy={fullPolicy}
                onEdit={editPolicy}
                onShare={sharePolicy}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Policies;

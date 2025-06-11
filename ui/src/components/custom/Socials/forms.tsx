import { useState, useEffect } from "react";
import { gql, useQuery, useMutation } from "@apollo/client";
import {
  Facebook,
  Github,
  Instagram,
  //   Linkedin,
  Twitter,
  Youtube,
  //   MessageCircle,
  //   Music,
  //   Headphones,
  //   Camera,
  Hash,
  Send,
  //   BookOpen,
  //   Paintbrush,
  Twitch,
  //   Phone,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import tiktok from "../../../assets/tt.png";
import reddit from "../../../assets/rr.png";
import spn from "../../../assets/spn.webp";
import pin from "../../../assets/pin.webp";
import ww from "../../../assets/ww.webp";
import ss from "../../../assets/sp.png";
import inin from "../../../assets/inin.webp";
import mmd from "../../../assets/medium-icon.svg";
import dis from "../../../assets/discord-thumb.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Link, useNavigate, useParams } from "react-router";
// import MainNaveBar from "@/components/serviceProviders/menuBar";
import BackButton from "@/components/back";
import { useCheckAuthId } from "@/middleware/context/checkID";
// import ContactInfo from "@/components/serviceProviders/profile";
// import { provider } from "@/components/landing/providerLandingPage";
interface SocialDataItem {
  name: string;
  icon: string;
  link: string;
}
// Define GraphQL queries and mutations
const GET_SOCIAL_MEDIA = gql`
  query GetSocialMedia($serviceId: String!) {
    getSocialMedia(serviceId: $serviceId) {
      id
      socialData
    }
  }
`;

const CREATE_SOCIAL_MEDIA = gql`
  mutation CreateSocialMedia($input: SocialMediaInput!) {
    createSocialMedia(input: $input) {
      id
      socialData
    }
  }
`;

// Define the social platform options with their details
const socialPlatforms = [
  {
    id: "youtube",
    name: "YouTube",
    icon: <Youtube className="h-5 w-5 " />,
    color: "#FF0000",
    urlPrefix: "https://youtube.com/@",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: <Instagram className="h-5 w-5" />,
    color: "#E1306C",
    urlPrefix: "https://instagram.com/",
  },
  {
    id: "twitter",
    name: "Twitter",
    icon: <Twitter className="h-5 w-5" />,
    color: "#1DA1F2",
    urlPrefix: "https://twitter.com/",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: <Facebook className="h-5 w-5" />,
    color: "#1877F2",
    urlPrefix: "https://facebook.com/",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: <img src={inin} alt="linkedin" className="h-5 w-5" />, // ← wrapped properly

    color: "#0A66C2",
    urlPrefix: "https://linkedin.com/in/",
  },
  {
    id: "github",
    name: "GitHub",
    icon: <Github className="h-5 w-5" />,
    color: "#333333",
    urlPrefix: "https://github.com/",
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: <img src={tiktok} alt="TikTok" className="h-5 w-5" />, // ← wrapped properly
    color: "#000000",
    urlPrefix: "https://tiktok.com/@",
  },
  {
    id: "pinterest",
    name: "Pinterest",
    icon: <img src={pin} alt="pinterest" className="h-5  w-5 " />, // ← wrapped properly

    color: "#fff",
    urlPrefix: "https://pinterest.com/",
  },
  {
    id: "snapchat",
    name: "Snapchat",
    icon: <img src={spn} alt="discord" className="h-7 w-7" />, // ← wrapped properly

    color: "#FFFC00",
    urlPrefix: "https://snapchat.com/add/",
  },
  {
    id: "discord",
    name: "Discord",
    icon: <img src={dis} alt="discord" className="h-7 w-7" />, // ← wrapped properly

    color: "#fff",
    urlPrefix: "https://discord.com/users/",
  },
  {
    id: "twitch",
    name: "Twitch",
    icon: <Twitch className="h-5 w-5" />,
    color: "#9146FF",
    urlPrefix: "https://twitch.tv/",
  },
  {
    id: "reddit",
    name: "Reddit",
    icon: <img src={reddit} alt="reddit" className="h-5 w-5" />, // ← wrapped properly

    color: "#fff",
    urlPrefix: "https://reddit.com/user/",
  },
  {
    id: "medium",
    name: "Medium",
    icon: <img src={mmd} alt="medium" className="h-5 w-5" />, // ← wrapped properly

    color: "#fff",
    urlPrefix: "https://medium.com/@",
  },
  {
    id: "spotify",
    name: "Spotify",
    icon: <img src={ss} alt="spotify" className="h-5 w-5" />, // ← wrapped properly

    color: "#1DB954",
    urlPrefix: "https://open.spotify.com/user/",
  },
  {
    id: "telegram",
    name: "Telegram",
    icon: <Send className="h-5 w-5" />,
    color: "#0088cc",
    urlPrefix: "https://t.me/",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    icon: <img src={ww} alt="reddit" className="h-5 w-5" />, // ← wrapped properly

    color: "#25D366",
    urlPrefix: "https://wa.me/",
  },
];

// Helper function to get icon component by platform name
const getIconByPlatformName = (name: string) => {
  const platform = socialPlatforms.find(
    (p) => p.name.toLowerCase() === name.toLowerCase()
  );
  return platform?.icon || <Hash className="h-5 w-5" />;
};

// Helper function to get color by platform name
const getColorByPlatformName = (name: string) => {
  const platform = socialPlatforms.find(
    (p) => p.name.toLowerCase() === name.toLowerCase()
  );
  return platform?.color || "#333333";
};

// Define interfaces
interface SocialLink {
  platform: string;
  username: string;
  url: string;
  icon: React.ReactNode;
  color: string;
}

interface SocialDialogProps {
  socialLinks?: SocialLink[];
  serviceId: string;
  provider: provider;
}

interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  url: string;
  icon: React.ReactNode;
  color: string;
}
interface provider {
  number?: string;
  email?: string;
  location?: string;
}
// SocialDialog Component

function SocialDialog({
  socialLinks = [],
  serviceId,
  provider,
}: SocialDialogProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // Select first 3 social links for the button
  const buttonIcons = socialLinks.slice(0, 3);
  const { isMatch } = useCheckAuthId(serviceId);

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="relative flex items-center  cursor-pointer hover:shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2"
      >
        <div className="relative flex mr-3">
          {buttonIcons.map((social, index) => (
            <div
              key={social.platform}
              className="rounded-full flex items-center justify-center"
              style={{
                width: "32px",
                height: "32px",
                marginLeft: index > 0 ? "-10px" : "0",
                zIndex: 3 - index,
                transform: `translateX(${open ? index * 5 : 0}px)`,
                backgroundColor: social.color,
                color: "white",
              }}
            >
              {social.icon}
            </div>
          ))}
          {buttonIcons.length === 0 && (
            <Button className="gap-2 rounded-full bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Contact
            </Button>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white rounded-2xl shadow-xl max-h-[85vh]">
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-60px)]">
            {/* Provider Information Section */}
            <div className="mb-6 border-b pb-6">
              <div className="mb-4">
                <h3 className="font-medium text-lg">Contact Information</h3>
                <p className="text-sm text-gray-500">
                  Get in touch with this provider
                </p>
              </div>

              <div className="space-y-3">
                {provider.number && (
                  <a
                    href={`tel:${provider.number}`}
                    className="flex items-center p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <Phone className="h-4 w-4 text-blue-600" />
                    </div>
                    <span>{provider.number}</span>
                  </a>
                )}

                {provider.email && (
                  <a
                    href={`mailto:${provider.email}`}
                    className="flex items-center p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                      <Mail className="h-4 w-4 text-green-600" />
                    </div>
                    <span>{provider.email.slice(0, 20)}</span>...
                  </a>
                )}

                {provider.location && (
                  <div className="flex items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                      <MapPin className="h-4 w-4 text-red-600" />
                    </div>
                    <span>{provider.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Controls */}
            {isMatch && (
              <div className="text-center mb-6">
                <Button
                  onClick={() => {
                    setOpen(false);
                    navigate(`/social/${serviceId}`);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors"
                >
                  Manage Social Accounts
                </Button>
              </div>
            )}

            {/* Social Links Section */}
            <h3 className="font-medium mb-3">Social Media</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {socialLinks.length > 0 ? (
                socialLinks.map((social) => (
                  <Link
                    key={social.platform}
                    to={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className="group flex items-center p-3 rounded-xl transition-all duration-300 hover:bg-gray-50"
                  >
                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-full text-white transition-transform duration-300 group-hover:scale-110"
                      style={{ backgroundColor: social.color }}
                    >
                      {social.icon}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {social.platform}
                      </p>
                      <p className="text-xs text-gray-500">{social.username}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-2 text-center py-6 text-gray-500">
                  No social accounts added yet.
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 text-center">
            <button
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// SocialForm Component
export function SocialForm() {
  const { serviceId } = useParams<{ serviceId: string }>(); // Get ServiceId from URL

  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [username, setUsername] = useState("");
  const [url, setUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Apollo hooks
  const { data, loading, refetch } = useQuery(GET_SOCIAL_MEDIA, {
    variables: { serviceId: serviceId }, // Replace with actual serviceId
  });
  const [createSocialMedia] = useMutation(CREATE_SOCIAL_MEDIA);

  // Load accounts from the API
  useEffect(() => {
    if (data?.getSocialMedia?.socialData) {
      try {
        const socialDataArray = JSON.parse(data.getSocialMedia.socialData);

        const mappedAccounts = socialDataArray.map((item: SocialDataItem) => ({
          id: `${item.icon}-${Date.now()}`,
          platform: item.name,
          username: item.link.split("/").pop() || item.link,
          url: item.link,
          icon: getIconByPlatformName(item.name),
          color: getColorByPlatformName(item.name),
        }));
        setAccounts(mappedAccounts);
      } catch (e) {
        console.error("Error parsing social data:", e);
      }
    }
  }, [data]);

  // Generate URL based on platform and username
  const generateUrl = (platformId: string, username: string) => {
    const platform = socialPlatforms.find((p) => p.id === platformId);
    if (platform && username) {
      return platform.urlPrefix + username;
    }
    return "";
  };

  // Handle platform selection
  const handlePlatformChange = (value: string) => {
    setSelectedPlatform(value);
    if (username) {
      setUrl(generateUrl(value, username));
    }
  };

  // Handle username change
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    if (selectedPlatform) {
      setUrl(generateUrl(selectedPlatform, value));
    }
  };

  // Save to API
  const saveToAPI = async (account: SocialAccount) => {
    try {
      const platform = socialPlatforms.find((p) => p.name === account.platform);
      if (!platform) return;

      await createSocialMedia({
        variables: {
          input: {
            name: account.platform,
            icon: platform.id,
            link: account.url,
          },
        },
      });

      refetch();
    } catch (err) {
      console.error("Error saving social media:", err);
      toast.error("Failed to save changes", {
        description: "There was an error saving your social media account.",
      });
    }
  };

  // Add or update social account
  const handleAddAccount = async () => {
    if (!selectedPlatform || !username || !url) {
      toast.error("Error", {
        description: "Please fill in all fields",
      });
      return;
    }

    const platform = socialPlatforms.find((p) => p.id === selectedPlatform);
    if (!platform) return;

    const newAccount: SocialAccount = {
      id: editingId || `${selectedPlatform}-${Date.now()}`,
      platform: platform.name,
      username,
      url,
      icon: platform.icon,
      color: platform.color,
    };

    if (editingId) {
      // Update existing account
      setAccounts(
        accounts.map((acc) => (acc.id === editingId ? newAccount : acc))
      );
      setEditingId(null);
      await saveToAPI(newAccount);
      toast.success("Account updated", {
        description: `Your ${platform.name} account has been updated.`,
      });
    } else {
      // Add new account
      // Check if platform already exists
      if (accounts.some((acc) => acc.platform === platform.name)) {
        toast.error("Platform already added", {
          description: `You already have a ${platform.name} account added.`,
        });
        return;
      }

      setAccounts([...accounts, newAccount]);
      await saveToAPI(newAccount);
      toast.success("Account added", {
        description: `Your ${platform.name} account has been added.`,
      });
    }

    // Reset form
    setSelectedPlatform("");
    setUsername("");
    setUrl("");
  };

  // Edit account
  const handleEditAccount = (account: SocialAccount) => {
    const platform = socialPlatforms.find((p) => p.name === account.platform);
    if (!platform) return;

    setEditingId(account.id);
    setSelectedPlatform(platform.id);
    setUsername(account.username);
    setUrl(account.url);
  };

  // Delete account
  const handleDeleteAccount = async (id: string) => {
    const accountToDelete = accounts.find((acc) => acc.id === id);
    if (!accountToDelete) return;

    setAccounts(accounts.filter((acc) => acc.id !== id));

    if (editingId === id) {
      setEditingId(null);
      setSelectedPlatform("");
      setUsername("");
      setUrl("");
    }

    // For a delete operation, we'll send a createSocialMedia with an empty URL
    // which the backend can handle as a deletion
    try {
      const platform = socialPlatforms.find(
        (p) => p.name === accountToDelete.platform
      );
      if (platform) {
        await createSocialMedia({
          variables: {
            input: {
              name: accountToDelete.platform,
              icon: platform.id,
              link: "", // Empty link signals deletion
            },
          },
        });

        refetch();
      }
    } catch (err) {
      console.error("Error deleting social media:", err);
    }

    toast.error("Account removed", {
      description: "The social media account has been removed.",
    });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setSelectedPlatform("");
    setUsername("");
    setUrl("");
  };

  if (loading) {
    return (
      <div className="text-center py-8">Loading social media accounts...</div>
    );
  }

  //   if (error) {
  //     return (
  //       <div className="text-center py-8 text-red-500">
  //         Error loading social media accounts. Please try again.
  //       </div>
  //     );
  //   }

  return (
    <div className="flex py-8 w-full">
 

    <div className=" px-4 lg:flex gap-4 py-8 mx-auto ">
        {/* Form Section */}
        <Card className="flex-1">
          <BackButton />
          <CardContent className="">
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-4">
                  {editingId ? "Edit Social Account" : "Add Social Account"}
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="platform">Platform</Label>
                    <Select
                      value={selectedPlatform}
                      onValueChange={handlePlatformChange}
                    >
                      <SelectTrigger id="platform">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {socialPlatforms.map((platform) => (
                          <SelectItem key={platform.id} value={platform.id}>
                            <div className="flex items-center">
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center mr-2"
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  //   marginLeft: index > 0 ? "-10px" : "0",
                                  //   zIndex: 3 - index,
                                  //   transform: `translateX(${
                                  //     open ? index * 5 : 0
                                  //   }px)`,
                                  backgroundColor: platform.color,
                                  color: "white",
                                }}
                              >
                                {platform.icon}
                              </div>
                              {platform.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={handleUsernameChange}
                      placeholder="Your username on this platform"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="url">URL</Label>
                    <Input
                      id="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://"
                    />
                    <p className="text-xs text-muted-foreground">
                      URL is auto-generated but can be customized
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {editingId ? (
                      <>
                        <Button onClick={handleAddAccount} className="gap-1">
                          <Check className="h-4 w-4" /> Update
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="gap-1"
                        >
                          <X className="h-4 w-4" /> Cancel
                        </Button>
                      </>
                    ) : (
                      <Button onClick={handleAddAccount} className="gap-1">
                        <Plus className="h-4 w-4" /> Add Account
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        <div className="flex-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              {accounts.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No social accounts added yet. Add your first account to see it
                  here.
                </div>
              ) : (
                <ul className="space-y-3">
                  {accounts.map((account) => (
                    <li
                      key={account.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                          style={{
                            backgroundColor: account.color,
                            color: "white",
                          }}
                        >
                          {account.icon}
                        </div>
                        <div>
                          <p className="font-medium">{account.platform}</p>
                          <p className="text-sm text-muted-foreground">
                            {account.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditAccount(account)}
                          className="h-8 w-8"
                        >
                          <Edit2 className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteAccount(account.id)}
                          className="h-8 w-8 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Main SocialMediaManager component
export default function SocialMediaManager({
  serviceId,
  provider,
}: {
  serviceId: string;
  provider: provider;
}) {
  // const { serviceId } = useParams<{ serviceId: string }>(); // Get ServiceId from URL
  //
  const { data, loading } = useQuery(GET_SOCIAL_MEDIA, {
    variables: {
      serviceId,
    },
  });
  //   const [view, setView] = useState<"dialog" | "form">("dialog");

  // Format social links for the dialog
  const formatSocialLinks = () => {
    if (!data?.getSocialMedia?.socialData) return [];

    try {
      const socialDataArray = JSON.parse(data.getSocialMedia.socialData);
      return socialDataArray.map((item: SocialDataItem) => ({
        platform: item.name,
        username: item.link.split("/").pop() || item.link,
        url: item.link,
        icon: getIconByPlatformName(item.name),
        color: getColorByPlatformName(item.name),
      }));
    } catch (e) {
      console.error("Error parsing social data:", e);
      return [];
    }
  };

  // Decide which component to show based on the view state
  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <SocialDialog
      provider={provider}
      socialLinks={formatSocialLinks()}
      serviceId={serviceId}
    />
  );

}


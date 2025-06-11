
// SearchDataDasBoard.tsx
import { useState, useEffect, type ChangeEvent } from "react";
import { useQuery, gql } from "@apollo/client";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  Search,
  Phone,
  Building,
  User,
  X,
  Loader2,
  MessageCircle,
  PhoneCall,
  ChevronUp,
  ChevronDown,
  BarChart3,
  Menu,
  Users,
  Heart,
  Activity,
  FolderOpen,
  RefreshCw,
  Share2,
} from "lucide-react";
import { debounce } from "lodash";
import { Link } from "react-router";
import { toast } from "sonner";

// GraphQL Query
const GET_PROVIDERS_USERS_CONTACT = gql`
  query GetProvidersUsersContact($search: String, $limit: Int, $offset: Int) {
    getProvidersUsersContact(search: $search, limit: $limit, offset: $offset) {
      id
      name
      type
      number
      numberType
    }
  }
`;

// Types
interface Contact {
  id: string;
  name: string;
  type: string;
  number: string;
  numberType: string;
}

interface DashboardData {
  totalUsers: any[];
  totalBookingsIds: any[];
  recentActivityIds: any[];
  categoriesServiceTypes: any[];
}

interface SearchDataDasBoardProps {
  setIsStatsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isStatsOpen: boolean;
  isMenuOpen: boolean;
  setIsMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dashboardData: DashboardData;
  refetchDashboard: () => void;
}

export default function SearchDataDasBoard({
  setIsStatsOpen,
  isStatsOpen,
  isMenuOpen,
  setIsMenuOpen,
  dashboardData,
  refetchDashboard,
}: SearchDataDasBoardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Set up debounced search to avoid too many requests
  useEffect(() => {
    const handler = debounce(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
    }, 500);

    setIsSearching(true);
    handler();

    return () => {
      handler.cancel();
    };
  }, [searchTerm]);

  const { loading, error, data, fetchMore, refetch } = useQuery(
    GET_PROVIDERS_USERS_CONTACT,
    {
      variables: {
        search: debouncedSearchTerm,
        limit: 20,
        offset: 0,
      },
      fetchPolicy: "cache-and-network",
      notifyOnNetworkStatusChange: true,
    }
  );

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const loadMore = () => {
    if (contacts.length > 0) {
      fetchMore({
        variables: {
          offset: contacts.length,
          limit: 20,
          search: debouncedSearchTerm,
        },
        updateQuery: (prev, { fetchMoreResult }) => {
          if (!fetchMoreResult) return prev;
          return {
            getProvidersUsersContact: [
              ...prev.getProvidersUsersContact,
              ...fetchMoreResult.getProvidersUsersContact,
            ],
          };
        },
      });
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm("");
    refetch({
      search: "",
      limit: 20,
      offset: 0,
    });
  };

  // Share contact handler
  const shareContact = async (contact: Contact) => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/c/${contact.id}`;
    const shareData = {
      title: contact.name,
      text: `Contact: ${contact.name} (${contact.type})`,
      url: shareUrl,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Contact link copied to clipboard!");
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(shareUrl);
          toast.success("Contact link copied to clipboard!");
        } catch (clipboardErr) {
          toast.error("Failed to share or copy link");
        }
      }
    }
  };

  const contacts = data?.getProvidersUsersContact || [];
  const isLoading = loading || isSearching;

  // Function to render the appropriate number type icon
  const renderNumberTypeIcon = (numberType: string) => {
    if (numberType === "WHATSAPP") {
      return <MessageCircle className="h-3.5 w-3.5 text-primary" />;
    } else if (numberType === "PHONE") {
      return <PhoneCall className="h-3.5 w-3.5 text-secondary" />;
    } else {
      return <Phone className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="shadow-md border-0 mt-3">
        <CardHeader className="border-b bg-muted/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-10 py-2 border-slate-200"
              />
              {searchTerm && (
                <Button
                  onClick={handleClearSearch}
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                  <span className="sr-only">Clear search</span>
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex items-center justify-center p-3 h-auto hover:bg-gray-50 text-xs"
                onClick={() => setIsStatsOpen(!isStatsOpen)}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="font-medium">Quick Stats</span>
                </div>
                {isStatsOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                className="flex items-center justify-center p-3 h-auto hover:bg-gray-50 text-xs"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <div className="flex items-center gap-2">
                  <Menu className="h-4 w-4" />
                  <span className="font-medium">Menu</span>
                </div>
                {isMenuOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Collapsible Quick Stats */}
          {isStatsOpen && (
            <Collapsible open={isStatsOpen} onOpenChange={setIsStatsOpen}>
              <CollapsibleContent>
                <div className="p-4 border-b bg-muted/20">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                      <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                          <Users className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-2xl sm:text-3xl font-bold text-gray-900 leading-none">
                            {dashboardData.totalUsers.length}
                          </p>
                          <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">
                            Total Users
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                      <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                          <Heart className="h-6 w-6 sm:h-7 sm:w-7 text-red-600" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-2xl sm:text-3xl font-bold text-gray-900 leading-none">
                            {dashboardData.totalBookingsIds.length}
                          </p>
                          <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">
                            Favorites
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                      <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                          <Activity className="h-6 w-6 sm:h-7 sm:w-7 text-green-600" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-2xl sm:text-3xl font-bold text-gray-900 leading-none">
                            {dashboardData.recentActivityIds.length}
                          </p>
                          <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">
                            Recent Activity
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                      <div className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                          <FolderOpen className="h-6 w-6 sm:h-7 sm:w-7 text-purple-600" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-2xl sm:text-3xl font-bold text-gray-900 leading-none">
                            {dashboardData.categoriesServiceTypes.length}
                          </p>
                          <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">
                            Categories
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Collapsible Menu */}
          {isMenuOpen && (
            <Collapsible open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <CollapsibleContent>
                <div className="p-4 border-b bg-muted/20">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button
                      className="justify-start h-auto p-4 flex-col gap-2"
                      variant="outline"
                      onClick={() => {
                        window.location.href = "/contacts";
                      }}
                    >
                      <Users className="h-5 w-5" />
                      <span className="text-sm font-medium">All Contacts</span>
                      <span className="text-xs text-gray-500">View and manage contacts</span>
                    </Button>

                    <Button
                      className="justify-start h-auto p-4 flex-col gap-2"
                      variant="outline"
                      onClick={() => {
                        refetch();
                        refetchDashboard();
                      }}
                    >
                      <RefreshCw className="h-5 w-5" />
                      <span className="text-sm font-medium">Refresh Data</span>
                      <span className="text-xs text-gray-500">Update dashboard stats</span>
                    </Button>

                    <Button className="justify-start h-auto p-4 flex-col gap-2" variant="outline">
                      <Heart className="h-5 w-5" />
                      <span className="text-sm font-medium">Favorites</span>
                      <span className="text-xs text-gray-500">View favorite contacts</span>
                    </Button>

                    <Button className="justify-start h-auto p-4 flex-col gap-2" variant="outline">
                      <Activity className="h-5 w-5" />
                      <span className="text-sm font-medium">Recent Activity</span>
                      <span className="text-xs text-gray-500">View recent actions</span>
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Contact Results */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading contacts...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12 px-4">
              <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                <p className="font-medium">Error loading contacts</p>
                <p className="text-sm mt-1">{error.message}</p>
              </div>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="bg-muted/50 p-6 rounded-lg">
                <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="font-medium text-foreground">
                  {searchTerm
                    ? "No contacts found matching your search"
                    : "No contacts available"}
                </p>
                {searchTerm && (
                  <Button onClick={handleClearSearch} variant="outline" className="mt-3">
                    Clear search
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                >
                  <Link
                    to={`/c/${contact.id}`}
                    className="flex items-center flex-1 min-w-0"
                  >
                    <div
                      className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center ${
                        contact.type === "SERVICE"
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary/20 text-secondary-foreground"
                      }`}
                    >
                      {contact.type === "SERVICE" ? (
                        <Building className="h-6 w-6" />
                      ) : (
                        <User className="h-6 w-6" />
                      )}
                    </div>

                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold truncate">
                          {contact.name}
                        </h3>
                        <Badge
                          variant={
                            contact.type === "SERVICE" ? "secondary" : "outline"
                          }
                          className="ml-2 hidden sm:inline-flex"
                        >
                          {contact.type === "SERVICE" ? "Service" : "User"}
                        </Badge>
                      </div>

                      {contact.number && (
                        <div className="flex items-center mt-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded-full">
                            {renderNumberTypeIcon(contact.numberType)}
                            <span>{contact.number}</span>
                            {contact.numberType && (
                              <Badge
                                variant="outline"
                                className="ml-1 text-xs px-1.5 py-0 h-5"
                              >
                                {contact.numberType === "WHATSAPP"
                                  ? "WhatsApp"
                                  : contact.numberType === "PHONE"
                                  ? "Phone only"
                                  : contact.numberType}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="ml-4 flex items-center gap-2">
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        shareContact(contact);
                      }}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                    >
                      <Share2 className="h-4 w-4" />
                      <span className="sr-only">Share contact</span>
                    </Button>
                    
                    <Link to={`/c/${contact.id}`}>
                      <div className="rounded-full p-1 bg-muted">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M6 12L10 8L6 4"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </Link>
                  </div>
                </div>
              ))}

              {contacts.length >= 20 && (
                <div className="p-4 text-center">
                  <Button
                    onClick={loadMore}
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading more...
                      </>
                    ) : (
                      "Load more contacts"
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
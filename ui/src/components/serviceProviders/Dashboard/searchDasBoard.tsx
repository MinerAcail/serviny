import { useState, useEffect, type ChangeEvent } from "react";
import { useQuery, gql } from "@apollo/client";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
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
  NotepadText,
  Globe,
  AlertCircle,
  Info,
} from "lucide-react";
import { debounce } from "lodash";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import AddUserDialog from "@/components/user/PROVIDER/add-user-dialog";
import { DeliveryServiceSystem } from "../APPOINTMENT/DeliveryServiceBooking/DeliveryServiceSystem";
import { useAuth } from "@/middleware/context/authContext";

// GraphQL Query - Updated to include searchExternal parameter
const GET_PROVIDERS_USERS_CONTACT = gql`
  query GetProvidersUsersContact(
    $search: String
    $limit: Int
    $offset: Int
    $searchExternal: Boolean
  ) {
    getProvidersUsersContact(
      search: $search
      limit: $limit
      offset: $offset
      searchExternal: $searchExternal
    ) {
      id
      name
      type
      number
      numberType
      external
    }
  }
`;

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
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );
  const [isDialogOpen, setDialogOpen] = useState(false);

  const [searchExternal, setSearchExternal] = useState(false);
  const [showSearchOptions, setShowSearchOptions] = useState(false);
  const serviceId = user?.id;

  // Initialize state from URL parameters
  useEffect(() => {
    const searchQuery = searchParams.get("search") || "";
    const externalSearch = searchParams.get("external") === "true";
    const showOptions = searchParams.get("options") === "true";

    setSearchTerm(searchQuery);
    setDebouncedSearchTerm(searchQuery);
    setSearchExternal(externalSearch);

    // Show search options if there's a search term, external search is enabled, or options param is true
    if (searchQuery.trim() || externalSearch || showOptions) {
      setShowSearchOptions(true);
    }
  }, []);

  // Update URL when search parameters change
  const updateURL = (
    search: string,
    external: boolean,
    showOptions?: boolean
  ) => {
    const newSearchParams = new URLSearchParams(searchParams);

    if (search.trim()) {
      newSearchParams.set("search", search);
    } else {
      newSearchParams.delete("search");
    }

    if (external) {
      newSearchParams.set("external", "true");
    } else {
      newSearchParams.delete("external");
    }

    if (showOptions !== undefined) {
      if (showOptions) {
        newSearchParams.set("options", "true");
      } else {
        newSearchParams.delete("options");
      }
    }

    setSearchParams(newSearchParams, { replace: true });
  };

  // Set up debounced search to avoid too many requests
  useEffect(() => {
    const handler = debounce(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
      // Update URL when debounced search term changes
      updateURL(searchTerm, searchExternal);
    }, 500);

    setIsSearching(true);
    handler();

    return () => {
      handler.cancel();
    };
  }, [searchTerm, searchExternal]);

  const { loading, error, data, fetchMore, refetch } = useQuery(
    GET_PROVIDERS_USERS_CONTACT,
    {
      variables: {
        search: debouncedSearchTerm,
        limit: 20,
        offset: 0,
        searchExternal: searchExternal,
      },
      fetchPolicy: "cache-and-network",
      notifyOnNetworkStatusChange: true,
    }
  );

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Show search options when user starts typing
    if (value.trim() && !showSearchOptions) {
      setShowSearchOptions(true);
      updateURL(value, searchExternal, true);
    }
  };

  const handleExternalSearchToggle = (checked: boolean) => {
    setSearchExternal(checked);
    // Update URL immediately for external search toggle
    updateURL(searchTerm, checked, showSearchOptions);
    // Refetch with new search external setting
    refetch({
      search: debouncedSearchTerm,
      limit: 20,
      offset: 0,
      searchExternal: checked,
    });
  };

  const loadMore = () => {
    if (contacts.length > 0) {
      fetchMore({
        variables: {
          offset: contacts.length,
          limit: 20,
          search: debouncedSearchTerm,
          searchExternal: searchExternal,
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
    setShowSearchOptions(false);
    setSearchExternal(false);
    // Clear URL parameters
    const newSearchParams = new URLSearchParams();
    setSearchParams(newSearchParams, { replace: true });

    refetch({
      search: "",
      limit: 20,
      offset: 0,
      searchExternal: false,
    });
  };

  const contacts = data?.getProvidersUsersContact || [];
  const isLoading = loading || isSearching;

  // Count external vs internal contacts
  const externalContacts = contacts.filter((contact) => contact.external);
  const internalContacts = contacts.filter((contact) => !contact.external);

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
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-0">
      <Card className="shadow-md border-0 mt-3 overflow-hidden">
        <CardHeader className="border-b bg-muted/50 p-3 sm:p-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                type="search"
                placeholder="Search by name or phone number..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-10 py-2.5 border-slate-200 text-sm"
              />
              {searchTerm && (
                <Button
                  onClick={handleClearSearch}
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full z-10"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                  <span className="sr-only">Clear search</span>
                </Button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                className="flex items-center justify-center gap-2 px-3 py-2 h-auto hover:bg-gray-50 text-xs flex-1 sm:flex-none min-w-0"
                onClick={() => setIsStatsOpen(!isStatsOpen)}
              >
                <BarChart3 className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium truncate">Quick Stats</span>
                {isStatsOpen ? (
                  <ChevronUp className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                )}
              </Button>

              <Button
                variant="ghost"
                className="flex items-center justify-center gap-2 px-3 py-2 h-auto hover:bg-gray-50 text-xs flex-1 sm:flex-none min-w-0"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <Menu className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium truncate">Menu</span>
                {isMenuOpen ? (
                  <ChevronUp className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 flex-shrink-0" />
                )}
              </Button>
              
              <div className="flex-shrink-0">
                <AddUserDialog />
              </div>
            </div>
          </div>

          {/* Search Options Panel */}
          {showSearchOptions && searchTerm.trim() && (
            <div className="mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start justify-between mb-3 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Info className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-blue-900 truncate">
                    Search Options
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowSearchOptions(false);
                    updateURL(searchTerm, searchExternal, false);
                  }}
                  className="h-6 w-6 p-0 flex-shrink-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <Globe className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm text-blue-900 font-medium">
                      Search outside your service network
                    </span>
                    <span className="text-xs text-blue-700 break-words">
                      Find contacts not directly connected to your service
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 self-start sm:self-center">
                  <Switch
                    checked={searchExternal}
                    onCheckedChange={handleExternalSearchToggle}
                  />
                </div>
              </div>

              {searchExternal && (
                <div className="mt-3 p-3 bg-blue-100 rounded border border-blue-300">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-blue-800 min-w-0">
                      <p className="font-medium">External search enabled</p>
                      <p className="break-words">
                        You're now searching across all users, services, and
                        riders in the system, not just your connected contacts.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {/* Collapsible Quick Stats */}
          {isStatsOpen && (
            <Collapsible open={isStatsOpen} onOpenChange={setIsStatsOpen}>
              <CollapsibleContent>
                <div className="p-3 sm:p-4 border-b bg-muted/20">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                      <div className="flex flex-col items-center text-center">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-blue-100 rounded-full flex items-center justify-center mb-2 sm:mb-4">
                          <Users className="h-5 w-5 sm:h-7 sm:w-7 text-blue-600" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xl sm:text-3xl font-bold text-gray-900 leading-none">
                            {dashboardData.totalUsers.length}
                          </p>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Total Users
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                      <div className="flex flex-col items-center text-center">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-red-100 rounded-full flex items-center justify-center mb-2 sm:mb-4">
                          <Heart className="h-5 w-5 sm:h-7 sm:w-7 text-red-600" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xl sm:text-3xl font-bold text-gray-900 leading-none">
                            {dashboardData.totalBookingsIds.length}
                          </p>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Favorites
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                      <div className="flex flex-col items-center text-center">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-green-100 rounded-full flex items-center justify-center mb-2 sm:mb-4">
                          <Activity className="h-5 w-5 sm:h-7 sm:w-7 text-green-600" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xl sm:text-3xl font-bold text-gray-900 leading-none">
                            {dashboardData.recentActivityIds.length}
                          </p>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            Recent Activity
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                      <div className="flex flex-col items-center text-center">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-purple-100 rounded-full flex items-center justify-center mb-2 sm:mb-4">
                          <FolderOpen className="h-5 w-5 sm:h-7 sm:w-7 text-purple-600" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xl sm:text-3xl font-bold text-gray-900 leading-none">
                            {dashboardData.categoriesServiceTypes.length}
                          </p>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
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
                <div className="p-3 sm:p-4 border-b bg-muted/20">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Button
                      className="justify-start h-auto p-3 sm:p-4 flex-col gap-2 text-left"
                      variant="outline"
                      onClick={() => {
                        window.location.href = "/dbp/contacts";
                      }}
                    >
                      <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-sm font-medium">All Contacts</span>
                      <span className="text-xs text-gray-500">
                        View and manage contacts
                      </span>
                    </Button>

                    <Button
                      className="justify-start h-auto p-3 sm:p-4 flex-col gap-2 text-left"
                      variant="outline"
                      onClick={() => {
                        refetch();
                        refetchDashboard();
                      }}
                    >
                      <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-sm font-medium">Refresh Data</span>
                      <span className="text-xs text-gray-500">
                        Update dashboard stats
                      </span>
                    </Button>

                    <Button
                      className="justify-start h-auto p-3 sm:p-4 flex-col gap-2 text-left"
                      variant="outline"
                    >
                      <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-sm font-medium">Favorites</span>
                      <span className="text-xs text-gray-500">
                        View favorite contacts
                      </span>
                    </Button>

                    <Button
                      className="justify-start h-auto p-3 sm:p-4 flex-col gap-2 text-left"
                      variant="outline"
                    >
                      <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-sm font-medium">
                        Recent Activity
                      </span>
                      <span className="text-xs text-gray-500">
                        View recent actions
                      </span>
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Search Results Summary */}
          {searchTerm && !isLoading && contacts.length > 0 && (
            <div className="px-3 sm:px-4 py-3 bg-gray-50 border-b">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                <span className="font-medium">
                  Found {contacts.length} contacts
                </span>
                <div className="flex flex-wrap gap-3 text-xs">
                  {searchExternal && externalContacts.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0"></div>
                      <span>
                        {externalContacts.length} external contacts not in your
                        service network
                      </span>
                    </div>
                  )}
                  {internalContacts.length > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                      <span>
                        {internalContacts.length} from your service network
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Contact Results */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground text-center px-4">
                  {searchExternal
                    ? "Searching all contacts..."
                    : "Loading contacts..."}
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12 px-4">
              <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                <p className="font-medium">
                  No contacts found matching your search. Create New?
                </p>
                <div className="mt-3">
                  <AddUserDialog />
                </div>
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
                  <div className="mt-3 space-y-2">
                    {!searchExternal && (
                      <p className="text-sm text-muted-foreground">
                        Try enabling "Search outside your service network" to
                        find more contacts
                      </p>
                    )}
                    <Button onClick={handleClearSearch} variant="outline">
                      Clear search
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`flex items-center p-3 sm:p-5 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors ${
                    contact.external
                      ? "border-l-4 border-l-orange-300 bg-orange-50/30"
                      : ""
                  }`}
                >
                  <Link
                    to={`/dbp/c/${contact.id}`}
                    className="flex items-center flex-1 min-w-0"
                  >
                    <div
                      className={`flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center ${
                        contact.type === "SERVICE"
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary/20 text-secondary-foreground"
                      }`}
                    >
                      {contact.type === "SERVICE" ? (
                        <Building className="h-5 w-5 sm:h-6 sm:w-6" />
                      ) : (
                        <User className="h-5 w-5 sm:h-6 sm:w-6" />
                      )}
                    </div>

                    <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="text-sm sm:text-base font-semibold truncate">
                            {contact.name}
                          </h3>
                          {contact.external && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-orange-100 text-orange-700 border-orange-300 flex-shrink-0"
                            >
                              <Globe className="h-3 w-3 mr-1" />
                              External
                            </Badge>
                          )}
                        </div>
                      </div>

                      {contact.number && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
                          <div className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded-full min-w-0">
                            {renderNumberTypeIcon(contact.numberType)}
                            <span className="text-xs sm:text-sm truncate">
                              {contact.number}
                            </span>
                            {contact.numberType && (
                              <Badge
                                variant="outline"
                                className="ml-1 text-xs px-1.5 py-0 h-5 flex-shrink-0"
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

                      {contact.external && (
                        <div className="mt-1">
                          <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                            Not connected to your service
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="ml-2 sm:ml-4 flex items-center gap-2">
                     {contact.id && (
                            <Button
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedContactId(contact.id);
                                setDialogOpen(true);
                              }}
                              variant="secondary"
                              className="gap-2 rounded-full bg-secondary hover:bg-secondary/90 flex-shrink-0"
                              size="sm"
                            >
                              <NotepadText className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="text-xs sm:text-sm">Book Me</span>
                            </Button>
                          )}
                   
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
      {selectedContactId && (
        <DeliveryServiceSystem
          isDialogOpenMain={isDialogOpen}
          setDialogOpenMain={setDialogOpen}
          serviceId={serviceId}
          isService={true}
          userDataId={selectedContactId}
        />
      )}
    </div>
  );
}
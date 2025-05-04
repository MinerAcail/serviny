import { useState, useEffect, type ChangeEvent } from "react";
import { useQuery, gql } from "@apollo/client";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Phone,
  Building,
  User,
  X,
  Loader2,
  MessageCircle,
  PhoneCall,
} from "lucide-react";
import { debounce } from "lodash";
import { Link } from "react-router";

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

interface GetProvidersUsersContactData {
  getProvidersUsersContact: Contact[];
}

interface GetProvidersUsersContactVars {
  search: string;
  limit: number;
  offset: number;
}

export default function SearchDataDasBoard() {
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

  const { loading, error, data, fetchMore, refetch } = useQuery<
    GetProvidersUsersContactData,
    GetProvidersUsersContactVars
  >(GET_PROVIDERS_USERS_CONTACT, {
    variables: {
      search: debouncedSearchTerm,
      limit: 20,
      offset: 0,
    },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

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
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Loading contacts...
                </p>
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
                  <Button
                    onClick={handleClearSearch}
                    variant="outline"
                    className="mt-3"
                  >
                    Clear search
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {contacts.map((contact) => (
                <Link
                  key={contact.id}
                  to={`/c/${contact.id}`}
                  className="block transition-colors hover:bg-slate-50 dark:hover:bg-slate-900"
                >
                  <div className="flex items-center p-4 sm:p-5">
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

                    <div className="ml-4">
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
                    </div>
                  </div>
                </Link>
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

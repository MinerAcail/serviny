import { useQuery } from "@apollo/client";
import { LoaderCircle, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router";
// import NavBar from "./navBar";
import { gql } from "@apollo/client";
import LandingPage from "./page";
import { useCallback, useEffect, useRef, useState } from "react";
import { ItemNotFound, SpectaclesError, SpectaclesLoading } from "../custom/loading";
import MainNaveBar from "./menuBar";
// import MainNaveBar from "./menuBar";

interface Provider {
  id: string;
  name: string;
  type: string;
  profession: string[];
  dpfile: string | null;
  location: string;
}

const LIST_SERVICES = gql`
  query listServices($search: String, $limit: Int, $offset: Int) {
    listServices(search: $search, limit: $limit, offset: $offset) {
      id
      name
      type
      profession
      dpfile
      location
    }
  }
`;
const LIMIT = 10;

export function ServiceProvidersDirectory() {
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useRef<HTMLDivElement>(null);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const { data, loading, error, fetchMore, refetch } = useQuery(LIST_SERVICES, {
    variables: {
      search: searchTerm.trim() || null,
      limit: LIMIT,
      offset: 0,
    },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "network-only", // Force network request each time
    nextFetchPolicy: "network-only", // Ensure subsequent fetches also hit network
  });

  const [dialogState, setDialogState] = useState(() => {
    const savedState = localStorage.getItem("isDialogOpen");
    return savedState !== null ? JSON.parse(savedState) : true;
  });

  const loadMoreServices = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const firstEntry = entries[0];
      if (
        firstEntry.isIntersecting &&
        data?.listServices &&
        data.listServices.length >= LIMIT &&
        !isFetchingMore
      ) {
        setIsFetchingMore(true); // Set fetching state to true
        fetchMore({
          variables: {
            search: searchTerm.trim() || null,
            limit: LIMIT,
            offset: data.listServices.length || 0,
          },
          updateQuery: (prev, { fetchMoreResult }) => {
            setIsFetchingMore(false); // Reset fetching state after fetching
            if (!fetchMoreResult || fetchMoreResult.listServices.length === 0)
              return prev;
            return {
              listServices: [
                ...prev.listServices,
                ...fetchMoreResult.listServices,
              ],
            };
          },
        }).catch(() => setIsFetchingMore(false)); // Handle errors and reset state
      }
    },
    [fetchMore, searchTerm, data, isFetchingMore]
  );

  useEffect(() => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(loadMoreServices, {
      threshold: 0.5,
      rootMargin: "100px",
    });

    if (lastElementRef.current) {
      observer.current.observe(lastElementRef.current);
    }

    return () => observer.current?.disconnect(); // Cleanup observer
  }, [loadMoreServices, data?.listServices?.length]);

  useEffect(() => {
    const handleStorageChange = () => {
      const currentState = localStorage.getItem("isDialogOpen");
      if (currentState !== null) {
        setDialogState(JSON.parse(currentState));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  function handleSearch(value: string): void {
    setSearchTerm(value);
    refetch({ search: value.trim() || null });
  }

  if (dialogState) {
    return <LandingPage  onClose={() => setDialogState(false)} />;
  }

  // if (loading && !data) return <SpectaclesLoading />;

  // if (error) return <SpectaclesError />;

  return (
    <div className="max-w-6xl mx-auto px-3 py-6">
      <div className="mb-20">
        <MainNaveBar onSearch={handleSearch} />
      </div>
      {loading && !data && <SpectaclesLoading />}
      {error && <SpectaclesError />}
      {data?.listServices?.length === 0 && <ItemNotFound />}
      
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {data?.listServices?.map((provider: Provider) => (
          <Link
            to={`/providers/${provider.id}`}
            key={provider.id}
            className="group"
            onClick={()=>{
          localStorage.setItem("isServiceDialogOpen", JSON.stringify(true));

            }}
          >
            <Card className="h-full hover:shadow-md transition-all">
              <div className="relative">
                <div className="absolute right-2 top-2 z-10">
                  {provider?.profession?.slice(0, 1).map((profession, idx) => (
                    <Badge key={idx} className="text-xs">
                      {profession}
                      {provider.profession.length > 1 && (
                        <Badge className="text-[9px] rounded-full ml-1 w-fit h-fit bg-primary-foreground text-primary">
                          +{provider.profession.length - 1}
                        </Badge>
                      )}
                    </Badge>
                  ))}
                </div>
                <div className="aspect-square overflow-hidden">
                  <img
                    src={provider.dpfile || "/placeholder.svg"}
                    alt={provider.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              </div>
              <CardContent className="p-3">
                <h3 className="font-medium text-sm group-hover:text-primary truncate">
                  {provider.name}
                </h3>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <MapPin className="mr-1 h-3 w-3" />
                    <span className="truncate max-w-20">
                      {provider.location}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Loading indicator and intersection observer target */}
      <div ref={lastElementRef} className="flex justify-center py-4 mt-4">
        {isFetchingMore && (
          <LoaderCircle className="w-6 h-6 animate-spin text-primary" />
        )}
      </div>
    </div>
  );
}

import { useQuery } from "@apollo/client";
import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router";
import NavBar from "./navBar";
import { gql } from "@apollo/client";
import LandingPage from "./page";
import { useEffect, useState } from "react";
interface Provider {
  id: string;
  name: string;
  type: string;
  profession: string[];
  dpfile: string | null;
  location: string;
}

const ALL_PROVIDERS = gql`
  query listServices {
    listServices {
      id
      name
      type
      profession
      dpfile
      location
    }
  }
`;

export function ServiceProvidersDirectory() {
  const { data, loading, error, refetch } = useQuery(ALL_PROVIDERS);
  const [dialogState, setDialogState] = useState(() => {
    const savedState = localStorage.getItem("isDialogOpen");
    return savedState !== null ? JSON.parse(savedState) : true;
  });

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

  if (dialogState) {
    return <LandingPage onClose={() => setDialogState(false)} />;
  }
  if (loading) return <p className="text-center py-6">Loading...</p>;

  if (error)
    return (
      <p className="text-center py-6 text-red-500">Error loading providers</p>
    );


  return (
    <div className="max-w-6xl mx-auto px-3 py-6">
      <div className="mb-20">
        <NavBar />
      </div>

      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {data?.listServices.map((provider: Provider) => (
          <Link
            to={`/providers/${provider.id}`}
            key={provider.id}
            className="group"
          >
            <Card className="h-full hover:shadow-md transition-all">
              <div className="relative">
                {provider.dpfile && (
                  <Badge className="absolute right-2 top-2 z-10">
                    Featured
                  </Badge>
                )}
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
                  <div>
                    {provider?.profession?.slice(0, 1).map((profession, index) => (
                      <Badge key={index} className="text-xs">
                        {profession}
                      </Badge>
                    ))}
                    {provider?.profession?.length > 1 && (
                      <Badge className="text-xs rounded-full ml-1 bg-primary/10 text-primary">
                        +{provider.profession.length - 1}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <MapPin className="mr-1 h-3 w-3" />
                    <span className="truncate max-w-20">{provider.location}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

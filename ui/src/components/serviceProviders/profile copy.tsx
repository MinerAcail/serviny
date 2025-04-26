import { useEffect, useRef, useState } from "react";
import { gql, useQuery } from "@apollo/client";
import { useParams } from "react-router";
import {
  EditIcon,
  Mail,
  MapPin,
  NotepadText,
  Phone,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkGallery } from "./gallery";
import { Testimonials } from "./testimonials";
import TableBookingSystem from "./book";
import NavBar from "./navBar";
import { Link } from "react-router";
// import { gql } from "@/gql";

const GET_PROVIDER = gql`
  query getProvider($serviceId: String!) {
    getProvider(ServiceId: $serviceId) {
      id
      dpfile
      name
      number
      email
      profession
      aboutMe
      location
      createdAt
    }
  }
`;

export function ServiceProviderProfile() {
  const { serviceId } = useParams<{ serviceId: string }>(); // Get ServiceId from URL
  // console.log(serviceId);
  
  const { data, loading, error } = useQuery(GET_PROVIDER, {
    variables: { serviceId },
  });

  const [isTabsFixed, setIsTabsFixed] = useState(false);
  const [activeTab, setActiveTab] = useState("portfolio");
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabsPlaceholderRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (tabsRef.current && tabsPlaceholderRef.current) {
        const tabsPosition =
          tabsPlaceholderRef.current.getBoundingClientRect().top;
        setIsTabsFixed(tabsPosition <= 0);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeTab]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  if (!data?.getProvider) return <p>No provider found.</p>;

  const provider = data.getProvider;

  return (
    <div className="bg-gradient-to-b from-background to-muted/30 mt-4 justify-center items-center ">
      <div className="pb-11">
        <NavBar />
      </div>
      <div className="relative bg-primary/5 pb-20 p-4 rounded-md items-center">
        <div className="flex flex-col items-center md:flex-row md:items-start md:gap-8">
          <div className="relative h-40 w-40 overflow-hidden rounded-full border-4 border-background shadow-lg md:h-48 md:w-48">
            <img
              src={provider.dpfile || "/default-profile.png"}
              alt="Profile"
              className="h-full w-full object-cover rounded-full"
            />
          </div>
          <div className="mt-6 text-center md:mt-0 md:text-left">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {provider.name}
            </h1>
            <p className="text-xl text-muted-foreground">{provider.profession}</p>
            <p className="text-xl text-muted-foreground">{provider.location}</p>
            <div className="mt-3 flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
              ))}
              <span className="ml-2 font-medium">5.0</span>
              <span className="ml-1 text-muted-foreground">(24 reviews)</span>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
              <Link to={"/providerprofile"}>
                <Button className="gap-2 rounded-full">
                  <EditIcon className="h-4 w-4" /> Edit
                </Button>
              </Link>

              <Button variant="outline" className="gap-2 rounded-full">
                <Phone className="h-4 w-4" /> Call
              </Button>
              <TableBookingSystem
                isDialogOpenMain={isDialogOpen}
                setDialogOpenMain={setDialogOpen}
              />
              <Button
                onClick={() => setDialogOpen(true)}
                variant="secondary"
                className="gap-2 rounded-full"
              >
                <NotepadText className="h-4 w-4" /> Book
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-8 ">
        <div ref={tabsPlaceholderRef}></div>

        <div
          className={`${
            isTabsFixed
              ? "fixed top-0 left-0 right-0 bg-background/95 backdrop-blur-sm shadow-md z-50 py-2"
              : ""
          }`}
        >
          <div className={`${isTabsFixed ? "container mx-auto px-4" : ""}`}>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
              ref={tabsRef}
            >
              <TabsList className="grid w-full grid-cols-3 rounded-full bg-muted/50 p-1">
                <TabsTrigger value="portfolio" className="rounded-full">
                  Portfolio
                </TabsTrigger>
                <TabsTrigger value="testimonials" className="rounded-full">
                  Testimonials
                </TabsTrigger>
                <TabsTrigger value="about" className="rounded-full">
                  About
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div ref={contentRef} className={`${isTabsFixed ? "mt-16" : "mt-6"}`}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsContent value="portfolio">
              <WorkGallery />
            </TabsContent>
            <TabsContent value="testimonials">
              <Testimonials />
            </TabsContent>
            <TabsContent value="about">
              <Card className="overflow-hidden border-none bg-background/60 shadow-md backdrop-blur-sm">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold">About Me</h2>
                  <p className="mt-3 leading-relaxed text-muted-foreground">
                    {provider.aboutMe}
                  </p>
                  <div className="mt-6 space-y-4 rounded-lg bg-muted/50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Location</p>
                        <p className="text-sm text-muted-foreground">
                          {provider.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm text-muted-foreground">
                          {provider.number}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">
                          {provider.email}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQuery, gql } from "@apollo/client";
import { useAuth } from "@/middleware/context/authContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, User, Share2, Copy } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import RegisterOptions from "@/app/checkUserCreateUI";
import { useNavigate } from "react-router";
import { getImageUrl } from "../global/formatPrice";

const GET_USER_INFOR = gql`
  query GetUserInfor($userID: String!) {
    getUserInfor(userId: $userID) {
      id
      name
      type
      number
      email
      location
      dpfile
    }
  }
`;

export default function ProfileDialog() {
  const navigation = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(false);

  const { data, loading, error } = useQuery(GET_USER_INFOR, {
    variables: { userID: user?.id },
    skip: !user?.id,
  });

  const userInfo = data?.getUserInfor;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast("Copied!", {
        description: `${label} copied to clipboard`,
        duration: 1000,
      });
    });
  };

  return (
    <div className="flex items-center justify-center p-4">
      <button
        onClick={() => setOpen(true)}
        className="rounded-full overflow-hidden transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <Avatar className="h-7 w-7">
          <AvatarImage
            src={getImageUrl(userInfo?.dpfile) || "/placeholder.svg?height=200&width=200"}
            alt="Profile"
          />
          <AvatarFallback>
            <User className="h-8 w-8" />
          </AvatarFallback>
        </Avatar>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          {!userInfo ? (
            <RegisterOptions />
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{userInfo?.type}</DialogTitle>
              </DialogHeader>

              {loading ? (
                <p className="text-center text-muted-foreground">Loading...</p>
              ) : error ? (
                <p className="text-center text-red-500">
                  Error loading profile.
                </p>
              ) : (
                <div className="flex flex-col items-center space-y-4 pt-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage
                      src={
                       getImageUrl( userInfo?.dpfile) ||
                        "/placeholder.svg?height=200&width=200"
                      }
                      alt="Profile"
                    />
                    <AvatarFallback>
                      <User className="h-12 w-12" />
                    </AvatarFallback>
                  </Avatar>

                  <h2 className="text-2xl font-bold">
                    {userInfo?.name || "Unknown User"}
                  </h2>

                  <div className="w-full space-y-3">
                  
{
  userInfo?.location &&(

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                userInfo?.location || "",
                                "Location"
                              )
                            }
                            className="flex w-full items-center gap-2 text-muted-foreground p-2 rounded-md hover:bg-muted transition-colors"
                          >
                            <MapPin className="h-4 w-4" />
                            <span>{userInfo?.location || "N/A"}</span>
                            <Copy className="h-3 w-3 ml-auto opacity-50" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Click to copy</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
  )
}
{
  userInfo?.number &&(

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                userInfo?.number || "",
                                "Phone number"
                              )
                            }
                            className="flex w-full items-center gap-2 text-muted-foreground p-2 rounded-md hover:bg-muted transition-colors"
                          >
                            <Phone className="h-4 w-4" />
                            <span>{userInfo?.number || "N/A"}</span>
                            <Copy className="h-3 w-3 ml-auto opacity-50" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Click to copy</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
  )
}
{
  userInfo?.email&&(

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() =>
                              copyToClipboard(userInfo?.email || "", "Email")
                            }
                            className="flex w-full items-center gap-2 text-muted-foreground p-2 rounded-md hover:bg-muted transition-colors"
                          >
                            <Mail className="h-4 w-4" />
                            <span>{userInfo?.email || "N/A"}</span>
                            <Copy className="h-3 w-3 ml-auto opacity-50" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Click to copy</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
  )
}
                  </div>

                  {/* <div className="w-full flex gap-2 mt-4">
                   
                    <Button
                      variant="outline"
                      className="px-3"
                      onClick={() => {
                        const profileInfo = `
Name: ${userInfo?.name || "N/A"}
Location: ${userInfo?.location || "N/A"}
Phone: ${userInfo?.number || "N/A"}
Email: ${userInfo?.email || "N/A"}
                    `.trim();

                        copyToClipboard(profileInfo, "Profile information");
                      }}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div> */}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ProfileProviderDialog({ userID }: { userID: string }) {
  // const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(false);

  const { data, loading, error } = useQuery(GET_USER_INFOR, {
    variables: { userID },
    skip: !userID,
  });

  const userInfo = data?.getUserInfor;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast("Copied!", {
        description: `${label} copied to clipboard`,
        duration: 1000,
      });
    });
  };

  return (
    <div className="flex items-center justify-center">
      <button
        onClick={() => setOpen(true)}
        className="rounded-full overflow-hidden transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <Avatar className="h-7 w-7">
          <AvatarImage
            src={getImageUrl(userInfo?.dpfile) || "/placeholder.svg?height=200&width=200"}
            alt="Profile"
          />
          <AvatarFallback>
            <User className="h-8 w-8" />
          </AvatarFallback>
        </Avatar>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{userInfo?.type}</DialogTitle>
          </DialogHeader>

          {loading ? (
            <p className="text-center text-muted-foreground">Loading...</p>
          ) : error ? (
            <p className="text-center text-red-500">Error loading profile.</p>
          ) : (
            <div className="flex flex-col items-center space-y-4 pt-4">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src={
                    getImageUrl(userInfo?.dpfile) || "/placeholder.svg?height=200&width=200"
                  }
                  alt="Profile"
                />
                <AvatarFallback>
                  <User className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>

              <h2 className="text-2xl font-bold">
                {userInfo?.name || "Unknown User"}
              </h2>

              <div className="w-full space-y-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() =>
                          copyToClipboard(userInfo?.name || "", "Name")
                        }
                        className="flex w-full items-center gap-2 text-muted-foreground p-2 rounded-md hover:bg-muted transition-colors"
                      >
                        <User className="h-4 w-4" />
                        <span>{userInfo?.name || "N/A"}</span>
                        <Copy className="h-3 w-3 ml-auto opacity-50" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to copy</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() =>
                          copyToClipboard(userInfo?.location || "", "Location")
                        }
                        className="flex w-full items-center gap-2 text-muted-foreground p-2 rounded-md hover:bg-muted transition-colors"
                      >
                        <MapPin className="h-4 w-4" />
                        <span>{userInfo?.location || "N/A"}</span>
                        <Copy className="h-3 w-3 ml-auto opacity-50" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to copy</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            userInfo?.number || "",
                            "Phone number"
                          )
                        }
                        className="flex w-full items-center gap-2 text-muted-foreground p-2 rounded-md hover:bg-muted transition-colors"
                      >
                        <Phone className="h-4 w-4" />
                        <span>{userInfo?.number || "N/A"}</span>
                        <Copy className="h-3 w-3 ml-auto opacity-50" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to copy</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() =>
                          copyToClipboard(userInfo?.email || "", "Email")
                        }
                        className="flex w-full items-center gap-2 text-muted-foreground p-2 rounded-md hover:bg-muted transition-colors"
                      >
                        <Mail className="h-4 w-4" />
                        <span>{userInfo?.email || "N/A"}</span>
                        <Copy className="h-3 w-3 ml-auto opacity-50" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to copy</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="w-full flex gap-2 mt-4">
                <Button
                  className="flex-1"
                  variant={active ? "default" : "outline"}
                  onClick={() => setActive(!active)}
                >
                  {active ? (
                    <>
                      Active <Badge className="ml-2 bg-green-500">Online</Badge>
                    </>
                  ) : (
                    "Set Active"
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="px-3"
                  onClick={() => {
                    const profileInfo = `
Name: ${userInfo?.name || "N/A"}
Location: ${userInfo?.location || "N/A"}
Phone: ${userInfo?.number || "N/A"}
Email: ${userInfo?.email || "N/A"}
                    `.trim();

                    copyToClipboard(profileInfo, "Profile information");
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

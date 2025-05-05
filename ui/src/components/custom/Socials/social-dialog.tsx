"use client";

import type React from "react";

import { useState } from "react";
import {
  Facebook,
  Github,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  MessageCircle,
  Music,
  Headphones,
  Camera,
  Hash,
  Send,
  BookOpen,
  Paintbrush,
  Twitch,
  Phone,
} from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";

interface SocialLink {
  platform: string;
  username: string;
  url: string;
  icon: React.ReactNode;
  color: string;
}

interface SocialDialogProps {
  name?: string;
  title?: string;
  socialLinks?: SocialLink[];
}

export default function SocialDialog({
  socialLinks = [
    {
      platform: "YouTube",
      username: "janedoecreates",
      url: "https://youtube.com/@janedoecreates",
      icon: <Youtube className="h-5 w-5" />,
      color: "#FF0000",
    },
    {
      platform: "Instagram",
      username: "@janedoe",
      url: "https://instagram.com/janedoe",
      icon: <Instagram className="h-5 w-5" />,
      color: "#E1306C",
    },
    {
      platform: "Twitter",
      username: "@janedoe",
      url: "https://twitter.com/janedoe",
      icon: <Twitter className="h-5 w-5" />,
      color: "#1DA1F2",
    },
    {
      platform: "Facebook",
      username: "Jane Doe",
      url: "https://facebook.com/janedoe",
      icon: <Facebook className="h-5 w-5" />,
      color: "#1877F2",
    },
    {
      platform: "LinkedIn",
      username: "janedoe",
      url: "https://linkedin.com/in/janedoe",
      icon: <Linkedin className="h-5 w-5" />,
      color: "#0A66C2",
    },
    {
      platform: "GitHub",
      username: "janedoe",
      url: "https://github.com/janedoe",
      icon: <Github className="h-5 w-5" />,
      color: "#333333",
    },
    {
      platform: "TikTok",
      username: "@janedoe",
      url: "https://tiktok.com/@janedoe",
      icon: <Music className="h-5 w-5" />,
      color: "#000000",
    },
    {
      platform: "Pinterest",
      username: "janedoe",
      url: "https://pinterest.com/janedoe",
      icon: <Paintbrush className="h-5 w-5" />,
      color: "#E60023",
    },
    {
      platform: "Snapchat",
      username: "janedoe",
      url: "https://snapchat.com/add/janedoe",
      icon: <Camera className="h-5 w-5" />,
      color: "#FFFC00",
    },
    {
      platform: "Discord",
      username: "janedoe#1234",
      url: "https://discord.com/users/janedoe",
      icon: <MessageCircle className="h-5 w-5" />,
      color: "#5865F2",
    },
    {
      platform: "Twitch",
      username: "janedoe",
      url: "https://twitch.tv/janedoe",
      icon: <Twitch className="h-5 w-5" />,
      color: "#9146FF",
    },
    {
      platform: "Reddit",
      username: "u/janedoe",
      url: "https://reddit.com/user/janedoe",
      icon: <Hash className="h-5 w-5" />,
      color: "#FF4500",
    },
    {
      platform: "Medium",
      username: "@janedoe",
      url: "https://medium.com/@janedoe",
      icon: <BookOpen className="h-5 w-5" />,
      color: "#000000",
    },
    {
      platform: "Spotify",
      username: "Jane Doe",
      url: "https://open.spotify.com/user/janedoe",
      icon: <Headphones className="h-5 w-5" />,
      color: "#1DB954",
    },
    {
      platform: "Telegram",
      username: "@janedoe",
      url: "https://t.me/janedoe",
      icon: <Send className="h-5 w-5" />,
      color: "#0088cc",
    },
    {
      platform: "WhatsApp",
      username: "+1 234 567 8900",
      url: "https://wa.me/12345678900",
      icon: <Phone className="h-5 w-5" />,
      color: "#25D366",
    },
  ],
}: SocialDialogProps) {
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  // Select first 3 social links for the button
  const buttonIcons = socialLinks.slice(0, 3);

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className=" reltive flex items-center px- py- bg-whi  -gray shadow-m hover:shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2"
      >
        <div className="relative flex mr3">
          {buttonIcons.map((social, index) => (
            <div
              key={social.platform}
              className="rounded-full flex items-center justify-center -2 -white bg-white transition-all duration-300"
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
        </div>
        {/* <span className="text-sm font-medium text-gray-800">Social Accounts</span> */}
        {/* <div className="absolute inset-0 rounded-full bg-gray-50 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div> */}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white rounded-2xl -none shadow-xl max-h-[85vh]">
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-60px)]">
            <div className="text-center mb-6">
              <Button
                onClick={() => navigate("/social")}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors"
              >
                Add Social
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {socialLinks.map((social) => (
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
              ))}
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

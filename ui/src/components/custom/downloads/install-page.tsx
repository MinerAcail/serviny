"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import installAnimation from "./index.json";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowUpFromLine, Share } from "lucide-react";
import MainNaveBar from "@/components/serviceProviders/menuBar";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function InstallPage() {
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    const handler = (e: Event) => {
      const promptEvent = e as BeforeInstallPromptEvent;
      e.preventDefault();
      setDeferredPrompt(promptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    const timer = setTimeout(() => setIsVisible(true), 300);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, discard it
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#F2F6FF] to-[#FFFFFF] dark:from-[#1A1C29] dark:to-[#121212]">
        <div className="pb-11">
              <MainNaveBar />
            </div>
      <div
        className={`max-w-md w-full text-center transition-all duration-700 ease-out transform ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="mb-8 max-w-[200px] mx-auto">
          <Lottie
            animationData={installAnimation}
            loop={true}
            className="w-full h-full"
          />
        </div>

        <h1 className="text-2xl font-semibold mb-3 text-[#1D1D1F] dark:text-white">
          Add to Home Screen
        </h1>
        <p className="text-[#86868B] dark:text-[#A1A1A6] mb-8 text-base">
          Install for a faster, full-screen experience
        </p>

        {isAndroid && deferredPrompt ? (
          <Button
            size="lg"
            onClick={handleInstall}
            className="w-full rounded-full bg-[#007AFF] hover:bg-[#0071EB] text-white font-medium py-6 transition-all duration-300 shadow-sm"
          >
            <ArrowUpFromLine className="mr-2 h-5 w-5" />
            Install App
          </Button>
        ) : isIOS ? (
          <Card className="p-6 bg-[#F5F5F7] dark:bg-[#1C1C1E] border-0 rounded-2xl shadow-sm">
            <h3 className="font-medium text-lg mb-4 text-[#1D1D1F] dark:text-white">
              How to install:
            </h3>
            <ol className="text-left space-y-4">
              <li className="flex items-center gap-3">
                <span className="bg-[#007AFF] text-white w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                  1
                </span>
                <span className="text-[#424245] dark:text-[#E5E5EA]">
                  Tap the Share button
                </span>
                <Share className="h-5 w-5 text-[#007AFF] ml-auto" />
              </li>
              <li className="flex items-center gap-3">
                <span className="bg-[#007AFF] text-white w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                  2
                </span>
                <span className="text-[#424245] dark:text-[#E5E5EA]">
                  Scroll to "Add to Home Screen"
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span className="bg-[#007AFF] text-white w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium">
                  3
                </span>
                <span className="text-[#424245] dark:text-[#E5E5EA]">
                  Tap "Add" in the top right
                </span>
              </li>
            </ol>

            <div className="mt-6 pt-4 border-t border-[#E5E5EA] dark:border-[#38383A]">
              <Button
                variant="outline"
                className="w-full rounded-full border-[#007AFF] text-[#007AFF] hover:bg-[#007AFF]/10 font-medium"
              >
                Got it
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-6 bg-[#F5F5F7] dark:bg-[#1C1C1E] border-0 rounded-2xl shadow-sm">
            <p className="text-[#424245] dark:text-[#E5E5EA]">
              You can use the app in your browser or install it on a mobile
              device.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowUpFromLine, Share, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

// Custom animated phone component
const AnimatedPhone: React.FC = () => {
  const controls = useAnimation();

  useEffect(() => {
    const animatePhone = async () => {
      await controls.start({
        scale: [1, 1.1, 1],
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        },
      });
    };

    animatePhone();
  }, [controls]);

  return (
    <div className="relative flex items-center justify-center w-48 h-48 mx-auto">
      {/* Phone Body */}
      <motion.div
        animate={controls}
        className="relative"
        initial={{ scale: 1 }}
      >
        <div className="w-20 h-36 bg-white rounded-3xl border-4 border-gray-800 shadow-xl relative overflow-hidden">
          {/* Screen */}
          <div className="w-16 h-28 bg-gradient-to-b from-blue-100 to-blue-200 rounded-2xl m-1 mt-2 relative">
            {/* Status bar */}
            <div className="w-12 h-1 bg-gray-800 rounded-full mx-auto mt-1"></div>
            
            {/* App icons grid */}
            <div className="grid grid-cols-3 gap-1 p-2 mt-2">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="w-3 h-3 bg-blue-400 rounded-md opacity-60"></div>
              ))}
            </div>
          </div>
          
          {/* Home button */}
          <div className="w-4 h-4 bg-gray-800 rounded-full mx-auto mt-1"></div>
        </div>
      </motion.div>

      {/* Animated Download Arrow */}
      <motion.div
        className="absolute"
        initial={{ y: -40, opacity: 0 }}
        animate={{
          y: [0, 40, 0],
          opacity: [1, 1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
          <Download className="w-5 h-5 text-white" />
        </div>
      </motion.div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-30"
          initial={{
            x: Math.random() * 100 - 50,
            y: Math.random() * 100 - 50,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

export function InstallPage(): React.ReactElement {
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    const handler = (e: Event): void => {
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

  const handleInstall = async (): Promise<void> => {
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
      <motion.div
        className="max-w-md w-full text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: isVisible ? 1 : 0,
          y: isVisible ? 0 : 20,
        }}
        transition={{
          duration: 0.7,
          ease: "easeOut",
        }}
      >
        {/* Animated Phone Component */}
        <motion.div
          className="mb-8"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.8,
            delay: 0.2,
            ease: "easeOut",
          }}
        >
          <AnimatedPhone />
        </motion.div>

        <motion.h1
          className="text-2xl font-semibold mb-3 text-[#1D1D1F] dark:text-white"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          Add to Home Screen
        </motion.h1>

        <motion.p
          className="text-[#86868B] dark:text-[#A1A1A6] mb-8 text-base"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          Install for a faster, full-screen experience
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {isAndroid && deferredPrompt ? (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                size="lg"
                onClick={handleInstall}
                className="w-full rounded-full bg-[#007AFF] hover:bg-[#0071EB] text-white font-medium py-6 transition-all duration-300 shadow-sm"
              >
                <ArrowUpFromLine className="mr-2 h-5 w-5" />
                Install App
              </Button>
            </motion.div>
          ) : isIOS ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Card className="p-6 bg-[#F5F5F7] dark:bg-[#1C1C1E] border-0 rounded-2xl shadow-sm">
                <h3 className="font-medium text-lg mb-4 text-[#1D1D1F] dark:text-white">
                  How to install:
                </h3>
                <ol className="text-left space-y-4">
                  {[
                    { text: "Tap the Share button", icon: Share },
                    { text: "Scroll to \"Add to Home Screen\"", icon: null },
                    { text: "Tap \"Add\" in the top right", icon: null },
                  ].map((step, index) => (
                    <motion.li
                      key={index}
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: 0.8 + index * 0.1,
                      }}
                    >
                      <motion.span
                        className="bg-[#007AFF] text-white w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium"
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        {index + 1}
                      </motion.span>
                      <span className="text-[#424245] dark:text-[#E5E5EA]">
                        {step.text}
                      </span>
                      {step.icon && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1 + index * 0.1 }}
                        >
                          <step.icon className="h-5 w-5 text-[#007AFF] ml-auto" />
                        </motion.div>
                      )}
                    </motion.li>
                  ))}
                </ol>

                <motion.div
                  className="mt-6 pt-4 border-t border-[#E5E5EA] dark:border-[#38383A]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant="outline"
                      className="w-full rounded-full border-[#007AFF] text-[#007AFF] hover:bg-[#007AFF]/10 font-medium"
                    >
                      Got it
                    </Button>
                  </motion.div>
                </motion.div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Card className="p-6 bg-[#F5F5F7] dark:bg-[#1C1C1E] border-0 rounded-2xl shadow-sm">
                <p className="text-[#424245] dark:text-[#E5E5EA]">
                  You can use the app in your browser or install it on a mobile
                  device.
                </p>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
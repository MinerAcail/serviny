// settings.ts
import React, { createContext, useContext, useState, useEffect } from "react";

/**
 * Represents the structure of application settings.
 */
export interface AppSettings {
  fontSizeA: number;
  fontSizeB: number;
  fontSizeC: number;
  incrementingSize: number;
  textColor: string;
  theme: "light" | "dark";
  language: string;
  backgroundGradient: string; // New property for background gradient
}


/**
 * Context for managing and providing application settings.
 */
const AppSettingsContext = createContext<{
  settings: AppSettings;
  currentStep: any;
  updateSettings: (newSettings: AppSettings) => void;
  setCurrentStep: (prevStep: number) => void;
} | undefined>(undefined);

/**
 * Provides the context for managing application settings.
 * @param children - React components to be wrapped by the context provider.
 */
export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, updateSettings] = useState<AppSettings>({
    fontSizeB: 16,
    fontSizeC: 17,
    fontSizeA: 15,
    incrementingSize: 0,
    textColor: "black",
    theme: "light",
    language: "en",
    backgroundGradient:
      "linear-gradient(to right top, #ba80b1, #b685b7, #b189bd, #ad8ec2, #a892c6)", // Default gradient
  });
  const [currentStep, setCurrentStep] = useState(1);


  useEffect(() => {
    const storedSettings = localStorage.getItem("appSettings");
    if (storedSettings) {
      updateSettings(JSON.parse(storedSettings));
    }
  }, []);

  /**
   * Updates application settings and stores them in local storage.
   * @param newSettings - The new settings to apply.
   */
  const updateSettingsHandler = (newSettings: AppSettings) => {
    updateSettings(newSettings);
    localStorage.setItem("appSettings", JSON.stringify(newSettings));
  };

  const contextValue = {
    settings,
    updateSettings: updateSettingsHandler,
    currentStep, 
    setCurrentStep
  };

  return (
    <AppSettingsContext.Provider value={contextValue}>
      {children}
    </AppSettingsContext.Provider>
  );
};

/**
 * Custom hook for accessing and updating application settings.
 * @returns An object containing the current settings and the update function.
 */
export const useAppSettings = (): {
  settings: AppSettings;
  updateSettings: (newSettings: AppSettings) => void;
  currentStep: any;
  setCurrentStep: (prevStep: number) => void;
} => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error(
      "useAppSettings must be used within an AppSettingsProvider"
    );
  }
  return context;
};

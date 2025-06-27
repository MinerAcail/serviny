import { useEffect, useState } from "react";

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
  }).format(price);
}

// Custom hook for detecting screen size
export const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
  });

  useEffect(() => {
    // Function to update screen size
    const updateScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setScreenSize({
        width,
        height,
        isMobile: width < 640,
        isTablet: width >= 640 && width < 1024,
        isDesktop: width >= 1024,
      });
    };

    // Initial update
    updateScreenSize();

    // Add event listener for window resize
    window.addEventListener("resize", updateScreenSize);

    // Clean up event listener
    return () => window.removeEventListener("resize", updateScreenSize);
  }, []);

  return screenSize;
};

export const ghSim = "GH¢";
export const ZONE_COLORS = [
  "#4ade80", // green
  "#facc15", // yellow
  "#f87171", // red
  "#60a5fa", // blue
  "#a78bfa", // purple
  "#f472b6", // pink
  "#fb7185", // rose
  "#34d399", // emerald
  "#fbbf24", // amber
  "#38bdf8", // sky
  "#818cf8", // indigo
  "#fca5a5", // light red
  "#bef264", // lime
  "#fdba74", // orange
  "#c4b5fd", // light purple
  "#f9a8d4", // light pink
  "#fcd34d", // gold
  "#6ee7b7", // teal
  "#fde68a", // light yellow
  "#bbf7d0", // mint
  "#fef08a", // pale yellow
  "#a7f3d0", // light teal
  "#fbcfe8", // blush
  "#fef9c3", // cream
  "#d1fae5", // aquamarine
  "#f3e8ff", // lavender
  "#f1f5f9", // light gray
  "#e0e7ff", // periwinkle
  "#f5d0fe", // orchid
  "#fca5a5", // salmon
  "#fde68a", // banana
  "#a3e635", // bright lime
  "#f87171", // coral
  "#fbbf24", // sunflower
  "#38bdf8", // cyan
  "#818cf8", // violet
  "#fca5a5", // blush red
  "#bef264", // neon green
  "#fdba74", // peach
  "#c4b5fd", // pastel purple
  "#f9a8d4", // pastel pink
  "#fcd34d", // lemon
  "#6ee7b7", // seafoam
  "#fde68a", // butter
  "#bbf7d0", // pale green
  "#fef08a", // light gold
  "#a7f3d0", // turquoise
  "#fbcfe8", // light blush
];
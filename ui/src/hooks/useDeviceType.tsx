import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

export function useDeviceType() {
  const [deviceType, setDeviceType] = React.useState<{
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
  }>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
  });

  React.useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth;
      setDeviceType({
        isMobile: width < MOBILE_BREAKPOINT,
        isTablet: width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT,
        isDesktop: width >= TABLET_BREAKPOINT,
      });
    };

    updateDeviceType(); // Initialize on mount
    window.addEventListener("resize", updateDeviceType);
    return () => window.removeEventListener("resize", updateDeviceType);
  }, []);

  return deviceType;
}

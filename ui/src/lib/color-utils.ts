// lib/color-utils.ts

// Convert HSL values to CSS custom property format
export function hslToCustomProp(h: number, s: number, l: number): string {
    return `${h} ${s}% ${l}%`
  }
  
  // Generate a complete theme object with all needed color variables
  export function generateThemeColors(
    baseHue: number,
    baseSaturation: number = 47.4,
    baseLightness: number = 30.2
  ) {
    // Light theme colors
    const light = {
      background: hslToCustomProp(baseHue, baseSaturation, 90),
      foreground: hslToCustomProp(baseHue, 84, 4.9),
      card: hslToCustomProp(0, 0, 100),
      cardForeground: hslToCustomProp(baseHue, 84, 4.9),
      popover: hslToCustomProp(0, 0, 100),
      popoverForeground: hslToCustomProp(baseHue, 84, 4.9),
      primary: hslToCustomProp(baseHue, baseSaturation, baseLightness),
      primaryForeground: hslToCustomProp(baseHue, 40, 98),
      secondary: hslToCustomProp(baseHue, 40, 96.1),
      secondaryForeground: hslToCustomProp(baseHue, baseSaturation, 11.2),
      muted: hslToCustomProp(baseHue, 40, 96.1),
      mutedForeground: hslToCustomProp(baseHue, 16.3, 46.9),
      accent: hslToCustomProp(baseHue, 40, 96.1),
      accentForeground: hslToCustomProp(baseHue, baseSaturation, 11.2),
      destructive: hslToCustomProp(0, 84.2, 60.2),
      destructiveForeground: hslToCustomProp(baseHue, 40, 98),
      border: hslToCustomProp(baseHue, 31.8, 91.4),
      input: hslToCustomProp(baseHue, 31.8, 91.4),
      ring: hslToCustomProp(baseHue, 84, 20.9),
      chart1: hslToCustomProp(baseHue, 76, 61),
      chart2: hslToCustomProp(baseHue + 31, 58, 39),
      chart3: hslToCustomProp(baseHue + 55, 37, 24),
      chart4: hslToCustomProp(baseHue - 22, 74, 66),
      chart5: hslToCustomProp(baseHue - 42, 87, 67),
      // Sidebar colors
      sidebarBackground: hslToCustomProp(baseHue, 30, 98),
      sidebarForeground: hslToCustomProp(baseHue, 25.3, 26.1),
      sidebarPrimary: hslToCustomProp(baseHue, 45.9, 30),
      sidebarPrimaryForeground: hslToCustomProp(baseHue, 40, 98),
      sidebarAccent: hslToCustomProp(baseHue, 24.8, 95.9),
      sidebarAccentForeground: hslToCustomProp(baseHue, 45.9, 10),
      sidebarBorder: hslToCustomProp(baseHue, 23, 91),
      sidebarRing: hslToCustomProp(baseHue, 91.2, 59.8),
    }
  
    // Dark theme colors
    const dark = {
      background: hslToCustomProp(baseHue, baseSaturation, 15),
      foreground: hslToCustomProp(baseHue, 40, 98),
      card: hslToCustomProp(baseHue, 44, 8.9),
      cardForeground: hslToCustomProp(baseHue, 40, 98),
      popover: hslToCustomProp(baseHue, 44, 8.9),
      popoverForeground: hslToCustomProp(baseHue, 40, 98),
      primary: hslToCustomProp(baseHue, 60, 50),
      primaryForeground: hslToCustomProp(baseHue, 10, 5),
      secondary: hslToCustomProp(baseHue, 32.6, 17.5),
      secondaryForeground: hslToCustomProp(baseHue, 40, 98),
      muted: hslToCustomProp(baseHue, 32.6, 17.5),
      mutedForeground: hslToCustomProp(baseHue, 20.2, 65.1),
      accent: hslToCustomProp(baseHue, 32.6, 17.5),
      accentForeground: hslToCustomProp(baseHue, 40, 98),
      destructive: hslToCustomProp(0, 62.8, 30.6),
      destructiveForeground: hslToCustomProp(baseHue, 40, 98),
      border: hslToCustomProp(baseHue, 32.6, 17.5),
      input: hslToCustomProp(baseHue, 32.6, 17.5),
      ring: hslToCustomProp(baseHue, 76.8, 45.9),
      chart1: hslToCustomProp(baseHue, 70, 50),
      chart2: hslToCustomProp(baseHue + 18, 60, 45),
      chart3: hslToCustomProp(baseHue - 22, 80, 55),
      chart4: hslToCustomProp(baseHue - 42, 65, 60),
      chart5: hslToCustomProp(baseHue - 62, 75, 55),
      // Sidebar colors
      sidebarBackground: hslToCustomProp(baseHue, 35.9, 10),
      sidebarForeground: hslToCustomProp(baseHue, 24.8, 95.9),
      sidebarPrimary: hslToCustomProp(baseHue, 76.3, 48),
      sidebarPrimaryForeground: hslToCustomProp(baseHue, 10, 100),
      sidebarAccent: hslToCustomProp(baseHue, 23.7, 15.9),
      sidebarAccentForeground: hslToCustomProp(baseHue, 24.8, 95.9),
      sidebarBorder: hslToCustomProp(baseHue, 23.7, 15.9),
      sidebarRing: hslToCustomProp(baseHue, 91.2, 59.8),
    }
  
    return { light, dark }
  }
  
  // Predefined themes
  export const predefinedThemes = {
    green: { hue: 142, saturation: 47.4, lightness: 30.2 },
    blue: { hue: 220, saturation: 47.4, lightness: 30.2 },
    purple: { hue: 270, saturation: 47.4, lightness: 30.2 },
    orange: { hue: 30, saturation: 47.4, lightness: 30.2 },
    red: { hue: 0, saturation: 47.4, lightness: 30.2 },
  }
export const predefinedThemes = {
  green: { hue: 142, saturation: 47.4, lightness: 30.2 },
  blue: { hue: 221, saturation: 83.2, lightness: 53.3 },
  red: { hue: 0, saturation: 84.2, lightness: 60.2 },
  purple: { hue: 262, saturation: 84, lightness: 66 },
}

export function generateThemeColors(h: number, s: number, l: number) {
  const hsl = `${h}, ${s}%, ${l}%`
  return {
    light: {
      primary: `hsl(${hsl})`,
      primaryForeground: "hsl(210, 40%, 98%)",
    },
    dark: {
      primary: `hsl(${hsl})`,
      primaryForeground: "hsl(210, 40%, 98%)",
    },
  }
}

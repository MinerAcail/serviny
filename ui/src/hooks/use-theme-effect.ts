// hooks/use-theme-effect.ts
import { useEffect } from 'react'
// import { useTheme } from '@/providers/theme-provider'
import { generateThemeColors } from '@/lib/color-utils'
import { useTheme } from '@/middleware/context/theme-provider'

export function useThemeEffect() {
  const { customTheme } = useTheme()
  
  useEffect(() => {
    if (customTheme) {
      try {
        const parsedTheme = JSON.parse(customTheme)
        const { hue, saturation, lightness } = parsedTheme
        const colors = generateThemeColors(hue, saturation, lightness)
        const root = document.documentElement
        
        // Apply colors for light mode
        Object.entries(colors.light).forEach(([key, value]) => {
          const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
          root.style.setProperty(`--${cssKey}`, value)
        })
        
        // Apply colors for dark mode
        Object.entries(colors.dark).forEach(([key, value]) => {
          const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
          root.style.setProperty(`--${cssKey}-dark`, value)
        })
      } catch (e) {
        console.error("Failed to parse custom theme", e)
      }
    }
  }, [customTheme])
}
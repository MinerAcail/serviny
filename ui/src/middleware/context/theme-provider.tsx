import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark" | "system" | string

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  customTheme: string | null
  setCustomTheme: (theme: string | null) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  customTheme: null,
  setCustomTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => localStorage.getItem(storageKey) || defaultTheme
  )
  const [customTheme, setCustomTheme] = useState<string | null>(
    () => localStorage.getItem("custom-theme") || null
  )

  useEffect(() => {
    const root = window.document.documentElement
    
    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"
      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  useEffect(() => {
    if (customTheme) {
      localStorage.setItem("custom-theme", customTheme)
    } else {
      localStorage.removeItem("custom-theme")
    }
  }, [customTheme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
    customTheme,
    setCustomTheme: (theme: string | null) => {
      setCustomTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
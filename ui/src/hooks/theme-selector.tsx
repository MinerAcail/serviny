// components/theme-selector.tsx
import { useEffect, useState } from "react"
import {  Moon, Sun, RotateCcw, ChevronRight } from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,

} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { predefinedThemes, generateThemeColors } from "@/lib/color-utils"
import { useTheme } from "@/middleware/context/theme-provider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function ThemeSelector() {
  const { theme, setTheme, customTheme, setCustomTheme } = useTheme()
  const [hue, setHue] = useState(142)
  const [saturation, setSaturation] = useState(47.4)
  const [lightness, setLightness] = useState(30.2)
  const [activeTab, setActiveTab] = useState<string>("preset")
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Apply theme colors to document root
  function applyThemeColors(hue: number, saturation: number, lightness: number): void {
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
    
    // Save custom theme
    setCustomTheme(JSON.stringify({ hue, saturation, lightness }))
  }

  // Reset to default theme
  const resetToDefault = () => {
    const defaultTheme = predefinedThemes.green
    setHue(defaultTheme.hue)
    setSaturation(defaultTheme.saturation)
    setLightness(defaultTheme.lightness)
    applyThemeColors(defaultTheme.hue, defaultTheme.saturation, defaultTheme.lightness)
  }

  // Load custom theme on component mount
  useEffect(() => {
    if (customTheme) {
      try {
        const parsedTheme = JSON.parse(customTheme)
        setHue(parsedTheme.hue)
        setSaturation(parsedTheme.saturation)
        setLightness(parsedTheme.lightness)
        applyThemeColors(parsedTheme.hue, parsedTheme.saturation, parsedTheme.lightness)
      } catch (e) {
        console.error("Failed to parse custom theme", e)
      }
    }
  }, [customTheme])

  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-md">
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Appearance settings</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <DropdownMenuContent className="w-fit" align="end">
        <div className="flex flex-col p-2">
          <h4 className="font-medium text-sm mb-1">Appearance</h4>
          <div className="grid grid-cols-3 gap-1">
            <Button 
              variant={theme === "light" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setTheme("light")}
              className="h-8 justify-start px-2"
            >
              <Sun className="h-4 w-4 mr-1" />
              Light
            </Button>
            <Button 
              variant={theme === "dark" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setTheme("dark")}
              className="h-8 justify-start px-2"
            >
              <Moon className="h-4 w-4 mr-1" />
              Dark
            </Button>
            <Button 
              variant={theme === "system" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setTheme("system")}
              className="h-8 justify-start px-2"
            >
              <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" x2="16" y1="21" y2="21" />
                <line x1="12" x2="12" y1="17" y2="21" />
              </svg>
              System
            </Button>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        <Tabs defaultValue="preset" className="w-full" onValueChange={setActiveTab}>
          <div className="px-2 pt-1">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="preset">Preset Colors</TabsTrigger>
              <TabsTrigger value="custom">Custom Colors</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="preset" className="mt-2 space-y-1">
            <div className="grid grid-cols-2 gap-1 px-2">
              {Object.entries(predefinedThemes).map(([name, values]) => (
                <Button
                  key={name}
                  variant="outline"
                  size="sm"
                  className="justify-start h-9 px-2"
                  onClick={() => {
                    setHue(values.hue)
                    setSaturation(values.saturation)
                    setLightness(values.lightness)
                    applyThemeColors(values.hue, values.saturation, values.lightness)
                  }}
                >
                  <div 
                    className="mr-2 h-4 w-4 rounded-full"
                    style={{ 
                      backgroundColor: `hsl(${values.hue}, ${values.saturation}%, ${values.lightness}%)` 
                    }} 
                  />
                  <span className="capitalize">{name}</span>
                </Button>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="custom" className="mt-2">
            <div className="px-2 pb-3 space-y-3">
              <div 
                className="h-10 rounded-md transition-colors border"
                style={{ backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)` }}
              />
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Hue</span>
                  <span>{Math.round(hue)}°</span>
                </div>
                <Slider
                  value={[hue]}
                  min={0}
                  max={360}
                  step={1}
                  className="[&>span:first-child]:h-2.5"
                  onValueChange={(value: number[]) => {
                    setHue(value[0])
                    applyThemeColors(value[0], saturation, lightness)
                  }}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Saturation</span>
                  <span>{Math.round(saturation * 10) / 10}%</span>
                </div>
                <Slider
                  value={[saturation]}
                  min={0}
                  max={100}
                  step={0.1}
                  className="[&>span:first-child]:h-2.5"
                  onValueChange={(value) => {
                    setSaturation(value[0])
                    applyThemeColors(hue, value[0], lightness)
                  }}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Lightness</span>
                  <span>{Math.round(lightness * 10) / 10}%</span>
                </div>
                <Slider
                  value={[lightness]}
                  min={5}
                  max={95}
                  step={0.1}
                  className="[&>span:first-child]:h-2.5"
                  onValueChange={(value) => {
                    setLightness(value[0])
                    applyThemeColors(hue, saturation, value[0])
                  }}
                />
              </div>
              
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full flex items-center justify-center mt-2"
                onClick={resetToDefault}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Reset to Default
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        {activeTab === "custom" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="justify-between"
            >
              Advanced Options
              <ChevronRight className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
            </DropdownMenuItem>
            
            {showAdvanced && (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between mb-1">
                  <span>HSL Value:</span>
                  <code className="bg-muted px-1 rounded text-[0.7rem]">
                    {hue}, {Math.round(saturation)}%, {Math.round(lightness)}%
                  </code>
                </div>
                <div className="flex justify-between">
                  <span>HEX Value:</span>
                  <code className="bg-muted px-1 rounded text-[0.7rem]">
                    {hslToHex(hue, saturation, lightness)}
                  </code>
                </div>
              </div>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Helper function to convert HSL to HEX - useful for developers
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
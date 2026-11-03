"use client"

import type { IconButtonProps, SpanProps } from "@chakra-ui/react"
import { IconButton, Skeleton, Span } from "@chakra-ui/react"
import * as React from "react"
import { LuMoon, LuSun } from "react-icons/lu"

export interface ColorModeProviderProps {
  children?: React.ReactNode
}

type ColorMode = "light" | "dark"

export type UiAccessibilityPreferences = {
  text_size?: "normal" | "large";
  density?: "comfortable" | "compact";
  reduce_motion?: boolean;
};

export function applyUiAccessibilityPreferences(preferences: UiAccessibilityPreferences) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.textSize = preferences.text_size || "normal";
  root.dataset.density = preferences.density || "comfortable";
  root.dataset.reduceMotion = String(Boolean(preferences.reduce_motion));
}

interface ThemeContextValue {
  colorMode: ColorMode
  setColorMode: (mode: ColorMode) => void
  toggleColorMode: () => void
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined)

function getInitialTheme(): ColorMode {
  try {
    if (typeof window === "undefined") return "light"
    const stored = window.localStorage.getItem("theme")
    if (stored === "light" || stored === "dark") return stored
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    return prefersDark ? "dark" : "light"
  } catch {
    return "light"
  }
}

let currentColorMode: ColorMode = "light"
const colorModeListeners = new Set<() => void>()

function subscribeColorMode(listener: () => void) {
  colorModeListeners.add(listener)
  return () => colorModeListeners.delete(listener)
}

function getColorModeSnapshot(): ColorMode {
  return currentColorMode
}

function setCurrentColorMode(mode: ColorMode) {
  if (currentColorMode === mode) return
  currentColorMode = mode
  colorModeListeners.forEach((listener) => listener())
}

export function ColorModeProvider({ children }: React.PropsWithChildren<ColorModeProviderProps>) {
  const colorMode: ColorMode = React.useSyncExternalStore<ColorMode>(subscribeColorMode, getColorModeSnapshot, () => "light")

  React.useEffect(() => {
    setCurrentColorMode(getInitialTheme())
  }, [])

  React.useEffect(() => {
    try {
      const root = document.documentElement
      root.classList.toggle("dark", colorMode === "dark")
      root.classList.toggle("light", colorMode === "light")
      window.localStorage.setItem("theme", colorMode)
    } catch {
      return
    }
  }, [colorMode])

  React.useEffect(() => {
    try {
      const storedPreferences = window.localStorage.getItem("soland-ui-preferences")
      if (storedPreferences) applyUiAccessibilityPreferences(JSON.parse(storedPreferences))
      const handlePreferencesUpdated = () => {
        const preferences = window.localStorage.getItem("soland-ui-preferences")
        if (preferences) applyUiAccessibilityPreferences(JSON.parse(preferences))
      }
      window.addEventListener("soland-preferences-updated", handlePreferencesUpdated)
      return () => window.removeEventListener("soland-preferences-updated", handlePreferencesUpdated)
    } catch {
      return
    }
  }, [])

  const setColorMode = (mode: ColorMode) => setCurrentColorMode(mode)
  const toggleColorMode = () => setCurrentColorMode(currentColorMode === "dark" ? "light" : "dark")

  return (
    <ThemeContext.Provider value={{ colorMode, setColorMode, toggleColorMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useColorMode(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext)
  if (!ctx) throw new Error("useColorMode must be used within ColorModeProvider")
  return ctx
}

export function useColorModeValue<T>(light: T, dark: T) {
  const { colorMode } = useColorMode()
  return colorMode === "dark" ? dark : light
}

export function ColorModeIcon() {
  const { colorMode } = useColorMode()
  return colorMode === "dark" ? <LuMoon /> : <LuSun />
}

type ColorModeButtonProps = Omit<IconButtonProps, "aria-label">

export const ColorModeButton = React.forwardRef<HTMLButtonElement, ColorModeButtonProps>(function ColorModeButton(props, ref) {
  const { toggleColorMode } = useColorMode()
  return (
    <React.Suspense fallback={<Skeleton boxSize="9" />}>
      <IconButton
        onClick={toggleColorMode}
        variant="ghost"
        aria-label="Toggle color mode"
        size="sm"
        ref={ref}
        {...props}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ColorModeIcon />
      </IconButton>
    </React.Suspense>
  )
})

export const LightMode = React.forwardRef<HTMLSpanElement, SpanProps>(function LightMode(props, ref) {
  return (
    <Span color="fg" display="contents" className="chakra-theme light" colorPalette="gray" colorScheme="light" ref={ref} {...props} />
  )
})

export const DarkMode = React.forwardRef<HTMLSpanElement, SpanProps>(function DarkMode(props, ref) {
  return (
    <Span color="fg" display="contents" className="chakra-theme dark" colorPalette="gray" colorScheme="dark" ref={ref} {...props} />
  )
})

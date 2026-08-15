"use client"

import type { IconButtonProps, SpanProps } from "@chakra-ui/react"
import { IconButton, Skeleton, Span } from "@chakra-ui/react"
import * as React from "react"
import { LuMoon, LuSun } from "react-icons/lu"

export interface ColorModeProviderProps {
  children?: React.ReactNode
}

type ColorMode = "light" | "dark"

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
  } catch (err) {
    return "light"
  }
}

export function ColorModeProvider({ children }: React.PropsWithChildren<ColorModeProviderProps>) {
  const [colorMode, setColorModeState] = React.useState<ColorMode>("light")

  React.useEffect(() => {
    try {
      const initialTheme = getInitialTheme()
      setColorModeState(initialTheme)
      const root = document.documentElement
      root.classList.toggle("dark", initialTheme === "dark")
      root.classList.toggle("light", initialTheme === "light")
      window.localStorage.setItem("theme", initialTheme)
    } catch (err) {
      // ignore
    }
  }, [])

  const setColorMode = (mode: ColorMode) => setColorModeState(mode)
  const toggleColorMode = () => setColorModeState((m) => (m === "dark" ? "light" : "dark"))

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

interface ColorModeButtonProps extends Omit<IconButtonProps, "aria-label"> {}

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

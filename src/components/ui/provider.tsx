"use client"

import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import { CacheProvider } from "@emotion/react"
import emotionCache from "@/lib/emotion-cache"
import { ColorModeProvider, type ColorModeProviderProps } from "./color-mode"

export function Provider({ children, ...props }: ColorModeProviderProps) {
  return (
    <CacheProvider value={emotionCache}>
      <ColorModeProvider {...props}>
        <ChakraProvider value={defaultSystem}>
          {children}
        </ChakraProvider>
      </ColorModeProvider>
    </CacheProvider>
  )
}
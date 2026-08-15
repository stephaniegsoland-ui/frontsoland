"use client"

import { useMemo } from "react"
import { CacheProvider } from "@emotion/react"
import createEmotionCache from "@/lib/emotion-cache"
import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import { ColorModeProvider, type ColorModeProviderProps } from "./color-mode"

export interface ProviderProps extends ColorModeProviderProps {
  emotionCache?: any
}

export function Provider({ children, emotionCache, ...props }: ProviderProps) {
  const cache = useMemo(() => emotionCache ?? createEmotionCache(), [emotionCache])

  return (
    <CacheProvider value={cache}>
      <ChakraProvider value={defaultSystem}>
        <ColorModeProvider {...props}>{children}</ColorModeProvider>
      </ChakraProvider>
    </CacheProvider>
  )
}

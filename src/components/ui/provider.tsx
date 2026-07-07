"use client"

import { ChakraProvider } from "@chakra-ui/react"
import { ColorModeProvider, type ColorModeProviderProps } from "./color-mode"

export function Provider({ children, ...props }: ColorModeProviderProps) {
  return (
    <ColorModeProvider {...props}>
      <ChakraProvider>
        {children}
      </ChakraProvider>
    </ColorModeProvider>
  )
}
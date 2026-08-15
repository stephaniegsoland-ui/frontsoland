import { CacheProvider } from "@emotion/react"
import createCache from "@emotion/cache"
import createEmotionServer from "@emotion/server/create-instance"
import { useServerInsertedHTML } from "next/navigation"
import { renderToString } from "react-dom/server"
import type { ReactNode } from "react"

export function EmotionServer({ children }: { children: ReactNode }) {
  const cache = createCache({ key: "css", prepend: true })
  const { extractCriticalToChunks, constructStyleTagsFromChunks } = createEmotionServer(cache)

  useServerInsertedHTML(() => {
    const html = renderToString(<CacheProvider value={cache}>{children}</CacheProvider>)
    const chunks = extractCriticalToChunks(html)
    return <>{constructStyleTagsFromChunks(chunks)}</>
  })

  return <CacheProvider value={cache}>{children}</CacheProvider>
}

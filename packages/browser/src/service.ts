import { Effect } from "effect"
import { FetchError, ParseError } from "./errors.ts"
import type { BrowserError } from "./errors.ts"

export interface FetchedPage {
  url: string
  title: string
  text: string
  html: string
}

export interface SearchResult {
  title: string
  url: string
  snippet: string
}

export class BrowserService {
  constructor(
    private readonly options: {
      userAgent?: string
      timeout?: number
    } = {}
  ) {}

  fetchUrl(url: string): Effect.Effect<FetchedPage, BrowserError> {
    return Effect.tryPromise({
      try: async () => {
        const controller = new AbortController()
        const timeout = setTimeout(
          () => controller.abort(),
          this.options.timeout ?? 15_000
        )

        try {
          const res = await fetch(url, {
            signal: controller.signal,
            headers: {
              "User-Agent":
                this.options.userAgent ??
                "Mozilla/5.0 (compatible; Weric/0.1; +https://weric.ai)",
            },
          })

          if (!res.ok) {
            throw new FetchError({
              url,
              status: res.status,
              message: `HTTP ${res.status}: ${res.statusText}`,
            })
          }

          const html = await res.text()
          const title = this.extractTitle(html)
          const text = this.extractText(html)

          return { url, title, text, html }
        } finally {
          clearTimeout(timeout)
        }
      },
      catch: cause => {
        if (cause instanceof FetchError) return cause
        if (cause instanceof Error && cause.name === "AbortError") {
          return new FetchError({ url, message: "Request timed out" })
        }
        return new FetchError({
          url,
          message: cause instanceof Error ? cause.message : String(cause),
        })
      },
    })
  }

  searchWeb(query: string): Effect.Effect<SearchResult[], BrowserError> {
    return Effect.tryPromise({
      try: async () => {
        const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&hitsPerPage=10&tags=story`
        const res = await fetch(url, {
          headers: {
            "User-Agent":
              this.options.userAgent ??
              "Mozilla/5.0 (compatible; Weric/0.1; +https://weric.ai)",
          },
        })
        if (!res.ok) {
          throw new Error(`HN search returned ${res.status}`)
        }
        const body = (await res.json()) as {
          hits: Array<{
            title: string
            url: string | null
            story_url: string | null
            objectID: string
          }>
        }
        return body.hits
          .filter(h => h.title)
          .map(h => ({
            title: h.title,
            url:
              h.url ??
              h.story_url ??
              `https://news.ycombinator.com/item?id=${h.objectID}`,
            snippet: h.title,
          }))
      },
      catch: cause =>
        new FetchError({
          url: `hn.algolia.com/search?q=${query}`,
          message: cause instanceof Error ? cause.message : String(cause),
        }),
    })
  }

  extractContent(
    html: string
  ): Effect.Effect<{ title: string; text: string }, BrowserError> {
    return Effect.tryPromise({
      try: async () => ({
        title: this.extractTitle(html),
        text: this.extractText(html),
      }),
      catch: cause =>
        new ParseError({
          message: "Failed to extract content",
          cause,
        }),
    })
  }

  private extractTitle(html: string): string {
    const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    return match ? (match[1] ?? "Untitled").trim() : "Untitled"
  }

  private extractText(html: string): string {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#\d+;/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 50_000)
  }
}

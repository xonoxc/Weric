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
    return Effect.acquireUseRelease(
      Effect.sync(() => {
        const controller = new AbortController()

        const timeout = setTimeout(
          () => controller.abort(),
          this.options.timeout ?? 15_000
        )

        return { controller, timeout }
      }),
      ({ controller }) =>
        Effect.tryPromise({
          try: async () => {
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

            return {
              url,
              title: this.extractTitle(html),
              text: this.extractText(html),
              html,
            }
          },

          catch: cause => {
            if (cause instanceof FetchError) return cause

            if (cause instanceof Error && cause.name === "AbortError") {
              return new FetchError({
                url,
                message: "Request timed out",
              })
            }

            return new FetchError({
              url,
              message: cause instanceof Error ? cause.message : String(cause),
            })
          },
        }),

      ({ timeout }) => Effect.sync(() => clearTimeout(timeout))
    )
  }

  searchWeb(query: string): Effect.Effect<SearchResult[], BrowserError> {
    return Effect.acquireUseRelease(
      Effect.sync(() => {
        const controller = new AbortController()

        const timeout = setTimeout(
          () => controller.abort(),
          this.options.timeout ?? 15_000
        )

        return { controller, timeout }
      }),
      ({ controller }) =>
        Effect.tryPromise({
          try: async () => {
            const apiKey =
              process.env.EXA_SEARCH_API_KEY ?? process.env.EXA_API_KEY
            if (!apiKey) {
              throw new Error(
                "Exa search requires EXA_SEARCH_API_KEY or EXA_API_KEY in the environment"
              )
            }

            const res = await fetch("https://api.exa.ai/search", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                query,
                type: "auto",
                numResults: 10,
                contents: { highlights: true },
              }),
              signal: controller.signal,
            })

            if (!res.ok) {
              const bodyText = await res.text().catch(() => "")
              throw new Error(
                `Exa search returned ${res.status}: ${bodyText.slice(0, 200)}`
              )
            }

            const body = (await res.json()) as {
              results?: Array<{
                title?: string | null
                url?: string | null
                highlights?: string[] | null
                text?: string | null
              }>
            }

            return (body.results ?? [])
              .filter(r => r.url && r.title)
              .map(r => ({
                title: r.title ?? "",
                url: r.url ?? "",
                snippet: (r.highlights && r.highlights[0]) || r.title || "",
              }))
          },
          catch: cause =>
            new FetchError({
              url: `exa.ai/search?q=${encodeURIComponent(query)}`,
              message:
                cause instanceof Error && cause.name === "AbortError"
                  ? "Exa search timed out"
                  : cause instanceof Error
                    ? cause.message
                    : String(cause),
            }),
        }),
      ({ timeout }) => Effect.sync(() => clearTimeout(timeout))
    )
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

import { Effect, Schedule } from "effect"
import { createOpenAI } from "@ai-sdk/openai"
import { generateText, generateObject } from "ai"
import type { z } from "zod"
import { ProviderError, RateLimitError, TimeoutError } from "../errors.ts"
import type { AIError } from "../errors.ts"
import type {
  AIProvider,
  TextGenerationOptions,
  TextGenerationResult,
  StructuredGenerationResult,
} from "../provider.ts"

const DEFAULT_MODEL = "llama-3.3-70b-versatile"

function getApiKey(): string {
  return typeof process !== "undefined" && process.env
    ? (process.env.GROQ_API_KEY ?? "")
    : ""
}

function getModel(model?: string) {
  const groq = createOpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: getApiKey(),
  })
  return groq.chat(model ?? DEFAULT_MODEL)
}

function classifyError(error: unknown): AIError {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    if (
      msg.includes("rate limit") ||
      msg.includes("429") ||
      msg.includes("too many requests")
    ) {
      return new RateLimitError({ message: error.message })
    }
    if (
      msg.includes("timeout") ||
      msg.includes("timed out") ||
      msg.includes("deadline")
    ) {
      return new TimeoutError({ message: error.message })
    }
    return new ProviderError({ message: error.message, cause: error })
  }
  return new ProviderError({ message: "Unknown provider error", cause: error })
}

const retryPolicy = Schedule.exponential("100 millis", 2.0).pipe(
  Schedule.compose(Schedule.recurs(3))
)

export const groqProvider: AIProvider = {
  generateText(
    prompt: string,
    options?: TextGenerationOptions
  ): Effect.Effect<TextGenerationResult, AIError> {
    const model = getModel(options?.model)

    return Effect.tryPromise({
      try: () =>
        generateText({
          model,
          system: options?.system,
          prompt,
          maxTokens: options?.maxTokens,
          temperature: options?.temperature,
        }),
      catch: classifyError,
    }).pipe(
      Effect.retry(retryPolicy),
      Effect.map(result => ({
        text: result.text,
        usage: {
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
        },
      }))
    )
  },

  generateStructured<T>(
    prompt: string,
    schema: z.Schema<T>,
    options?: TextGenerationOptions
  ): Effect.Effect<StructuredGenerationResult<T>, AIError> {
    const model = getModel(options?.model)

    return Effect.tryPromise({
      try: () =>
        generateObject({
          model,
          system: options?.system,
          prompt,
          schema,
          maxTokens: options?.maxTokens,
          temperature: options?.temperature,
        }),
      catch: classifyError,
    }).pipe(
      Effect.retry(retryPolicy),
      Effect.map(result => ({
        object: result.object,
        usage: {
          promptTokens: result.usage.promptTokens,
          completionTokens: result.usage.completionTokens,
        },
      }))
    )
  },
}

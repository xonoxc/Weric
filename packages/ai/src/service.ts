import { Effect } from "effect"
import type { z } from "zod"
import type { AIProvider, TextGenerationOptions } from "./provider.ts"
import {
  SummarySchema,
  ClassificationSchema,
  ExtractedEntitiesSchema,
} from "./validation.ts"
import type { Summary, Classification, ExtractedEntities } from "./validation.ts"
import { ValidationError, UnsupportedFeatureError } from "./errors.ts"
import type { AIError } from "./errors.ts"

export class AIService {
  constructor(private readonly provider: AIProvider) {}

  summarize(
    content: string,
    options?: TextGenerationOptions & { maxLength?: number }
  ): Effect.Effect<Summary, AIError> {
    const lengthInstruction = options?.maxLength
      ? `Keep the summary under ${options.maxLength} characters.`
      : ""

    return this.provider
      .generateStructured(
        `Summarize the following content:\n\n${content}`,
        SummarySchema,
        {
          ...options,
          system: `You are a precise summarizer. ${lengthInstruction} Extract the key points and determine the overall tone.`,
        }
      )
      .pipe(Effect.map(result => result.object))
  }

  classify(
    content: string,
    categories: string[],
    options?: TextGenerationOptions
  ): Effect.Effect<Classification, AIError> {
    return this.provider
      .generateStructured(
        `Classify the following content into one of these categories: ${categories.join(", ")}\n\nContent:\n${content}`,
        ClassificationSchema,
        {
          ...options,
          system: `You are a content classifier. Choose the most appropriate category from: ${categories.join(", ")}. Provide a confidence score between 0 and 1.`,
        }
      )
      .pipe(Effect.map(result => result.object))
  }

  extractEntities(
    content: string,
    options?: TextGenerationOptions
  ): Effect.Effect<ExtractedEntities, AIError> {
    return this.provider
      .generateStructured(
        `Extract named entities from the following content:\n\n${content}`,
        ExtractedEntitiesSchema,
        {
          ...options,
          system:
            "You are an entity extractor. Identify people, organizations, locations, events, products, technologies, and topics mentioned in the text.",
        }
      )
      .pipe(Effect.map(result => result.object))
  }

  generateEmbeddings(_text: string): Effect.Effect<number[], AIError> {
    return Effect.fail(
      new UnsupportedFeatureError({
        feature: "embeddings",
        message:
          "Embeddings are not supported by the current provider (Groq). Use OpenAI or another provider with embedding support.",
      })
    )
  }

  structuredOutput<T>(
    prompt: string,
    schema: z.Schema<T>,
    options?: TextGenerationOptions & {
      system?: string
      validationMessage?: string
    }
  ): Effect.Effect<T, AIError> {
    return this.provider.generateStructured(prompt, schema, options).pipe(
      Effect.map(result => result.object),
      Effect.catchAll(error =>
        Effect.fail(
          new ValidationError({
            message: options?.validationMessage ?? "Failed to generate structured output",
            cause: error,
          })
        )
      )
    )
  }
}

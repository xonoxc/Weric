import { Effect, pipe, Schema } from "effect"
import {
  SummarySchema,
  ClassificationSchema,
  ExtractedEntitiesSchema,
  SynthesizedGraphSchema,
} from "./validation.ts"
import { ValidationError, UnsupportedFeatureError } from "./errors.ts"

import type { AIProvider, TextGenerationOptions } from "./provider.ts"
import type {
  Summary,
  Classification,
  ExtractedEntities,
  SynthesizedGraph,
} from "./validation.ts"
import type { AIError } from "./errors.ts"

export class AIService {
  constructor(private readonly provider: AIProvider) {}

  summarize(
    content: string,
    options?: TextGenerationOptions & {
      maxLength?: number
    }
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

  synthesizeGraph(context: {
    query: string
    items: { id: string; title: string; summary: string }[]
  }): Effect.Effect<SynthesizedGraph, AIError> {
    const itemLines = context.items
      .map(
        (it, i) =>
          `${i + 1}. [${it.id}] ${it.title}${it.summary ? ` — ${it.summary}` : ""}`
      )
      .join("\n")

    const prompt = `
        You are synthesizing a concept flow-graph for the query "${context.query}".

		From the following discovered sources, distill a small set of distinct concepts (roughly 5 to 10).
		For each concept, provide a concise summary and the storyIds of the sources that best support it.
		Then output DIRECTED flow edges that describe conceptual dependency or sequence (for example "A leads to B" or "A builds on B").
		Edges reference concepts by their exact name.

		Sources:
		${itemLines}
    `

    return this.provider
      .generateStructured(prompt, SynthesizedGraphSchema, {
        system:
          "You produce a structured concept graph. Concept names must be concise and distinct. storyIds must reference only the ids provided. Edge source and target must match concept names exactly.",
      })
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
    schema: Schema.Schema<T, any>,
    options?: TextGenerationOptions & {
      system?: string
      validationMessage?: string
    }
  ): Effect.Effect<T, AIError> {
    return pipe(
      this.provider.generateStructured(prompt, schema, options),

      Effect.map(result => result.object),
      Effect.catchAll(error => {
        const message =
          options?.validationMessage ?? "Failed to generate structured output"

        return Effect.fail(
          new ValidationError({
            message,
            cause: error,
          })
        )
      })
    )
  }
}

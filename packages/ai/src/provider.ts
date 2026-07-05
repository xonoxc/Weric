import { Effect } from "effect"
import type { z } from "zod"
import type { AIError } from "./errors.ts"

export interface TextGenerationOptions {
  model?: string
  system?: string
  maxTokens?: number
  temperature?: number
}

export interface TextGenerationResult {
  text: string
  usage: {
    promptTokens: number
    completionTokens: number
  }
}

export interface StructuredGenerationResult<T> {
  object: T
  usage: {
    promptTokens: number
    completionTokens: number
  }
}

export interface AIProvider {
  generateText(
    prompt: string,
    options?: TextGenerationOptions
  ): Effect.Effect<TextGenerationResult, AIError>

  generateStructured<T>(
    prompt: string,
    schema: z.Schema<T>,
    options?: TextGenerationOptions
  ): Effect.Effect<StructuredGenerationResult<T>, AIError>
}

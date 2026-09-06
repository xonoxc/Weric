import { describe, expect, it } from "@effect/vitest"
import { Effect, Option, Schema } from "effect"
import {
  ConceptSchema,
  ConceptEdgeSchema,
  ConceptStoryLinkSchema,
  ConceptGraphSchema,
  CreateConceptInputSchema,
} from "../concept.ts"

const UUID_A = "11111111-1111-1111-1111-111111111111"
const UUID_B = "22222222-2222-2222-2222-222222222222"
const UUID_C = "33333333-3333-3333-3333-333333333333"

describe("concept contracts", () => {
  it.effect("decodes a concept", () =>
    Effect.gen(function* () {
      const concept = yield* Schema.decodeUnknown(ConceptSchema)({
        id: UUID_A,
        chatId: UUID_B,
        name: "RAG",
        summary: "Retrieval augmented generation",
        positionX: null,
        positionY: null,
      })
      expect(concept.name).toBe("RAG")
      expect(concept.summary).toBe("Retrieval augmented generation")
    })
  )

  it.effect("rejects a concept with an empty name", () =>
    Effect.gen(function* () {
      const result = Schema.decodeUnknownOption(ConceptSchema)({
        id: UUID_A,
        chatId: UUID_B,
        name: "",
        summary: null,
        positionX: null,
        positionY: null,
      })
      expect(Option.isNone(result)).toBe(true)
    })
  )

  it.effect("decodes a directed concept edge", () =>
    Effect.gen(function* () {
      const edge = yield* Schema.decodeUnknown(ConceptEdgeSchema)({
        id: UUID_C,
        chatId: UUID_A,
        sourceConcept: UUID_A,
        targetConcept: UUID_B,
        label: "builds on",
      })
      expect(edge.sourceConcept).toBe(UUID_A)
      expect(edge.targetConcept).toBe(UUID_B)
    })
  )

  it.effect("decodes a concept-story link", () =>
    Effect.gen(function* () {
      const link = yield* Schema.decodeUnknown(ConceptStoryLinkSchema)({
        conceptId: UUID_A,
        storyId: UUID_B,
      })
      expect(link.conceptId).toBe(UUID_A)
    })
  )

  it.effect("decodes a full concept graph", () =>
    Effect.gen(function* () {
      const graph = yield* Schema.decodeUnknown(ConceptGraphSchema)({
        nodes: [
          {
            id: UUID_A,
            chatId: UUID_B,
            name: "RAG",
            summary: "sum",
            positionX: null,
            positionY: null,
          },
          {
            id: UUID_C,
            chatId: UUID_B,
            name: "Retrieval",
            summary: null,
            positionX: 120,
            positionY: 240,
          },
        ],
        edges: [
          {
            id: UUID_B,
            chatId: UUID_B,
            sourceConcept: UUID_A,
            targetConcept: UUID_C,
            label: "builds on",
          },
        ],
        conceptStories: [
          { conceptId: UUID_A, storyId: UUID_B },
          { conceptId: UUID_C, storyId: UUID_B },
        ],
      })
      expect(graph.nodes).toHaveLength(2)
      expect(graph.edges).toHaveLength(1)
      expect(graph.conceptStories).toHaveLength(2)
    })
  )

  it.effect("decodes create input with omitted position fields", () =>
    Effect.gen(function* () {
      const input = yield* Schema.decodeUnknown(CreateConceptInputSchema)({
        chatId: UUID_B,
        name: "RAG",
        summary: "sum",
      })
      expect(input.name).toBe("RAG")
      expect(input.positionX).toBeUndefined()
    })
  )
})

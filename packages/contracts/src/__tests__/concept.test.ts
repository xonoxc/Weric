import { describe, expect, it } from "vitest"
import { Schema } from "effect"
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
  it("decodes a concept", () => {
    const concept = Schema.decodeUnknownSync(ConceptSchema)({
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

  it("rejects a concept with an empty name", () => {
    expect(() =>
      Schema.decodeUnknownSync(ConceptSchema)({
        id: UUID_A,
        chatId: UUID_B,
        name: "",
        summary: null,
        positionX: null,
        positionY: null,
      })
    ).toThrow()
  })

  it("decodes a directed concept edge", () => {
    const edge = Schema.decodeUnknownSync(ConceptEdgeSchema)({
      id: UUID_C,
      chatId: UUID_A,
      sourceConcept: UUID_A,
      targetConcept: UUID_B,
      label: "builds on",
    })
    expect(edge.sourceConcept).toBe(UUID_A)
    expect(edge.targetConcept).toBe(UUID_B)
  })

  it("decodes a concept-story link", () => {
    const link = Schema.decodeUnknownSync(ConceptStoryLinkSchema)({
      conceptId: UUID_A,
      storyId: UUID_B,
    })
    expect(link.conceptId).toBe(UUID_A)
  })

  it("decodes a full concept graph", () => {
    const graph = Schema.decodeUnknownSync(ConceptGraphSchema)({
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

  it("decodes create input with omitted position fields", () => {
    const input = Schema.decodeUnknownSync(CreateConceptInputSchema)({
      chatId: UUID_B,
      name: "RAG",
      summary: "sum",
    })
    expect(input.name).toBe("RAG")
    expect(input.positionX).toBeUndefined()
  })
})

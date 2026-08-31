import { describe, expect, it } from "vitest"
import { Effect } from "effect"
import { AIService } from "../service.ts"
import type { AIProvider } from "../provider.ts"
import type {
  SynthesizedGraph,
  SynthesizedConcept,
  SynthesizedEdge,
} from "../validation.ts"

class FakeProvider implements AIProvider {
  constructor(private readonly output: SynthesizedGraph) {}

  generateText(): Effect.Effect<never, never> {
    throw new Error("generateText is not used in this test")
  }

  generateStructured<T>(): Effect.Effect<
    { object: T; usage: { promptTokens: number; completionTokens: number } },
    never
  > {
    return Effect.succeed({
      object: this.output as unknown as T,
      usage: { promptTokens: 0, completionTokens: 0 },
    })
  }
}

describe("AIService.synthesizeGraph", () => {
  it("distills concepts and directed flow edges from story items", async () => {
    const provider = new FakeProvider({
      concepts: [
        {
          name: "RAG",
          summary: "Retrieval augmented generation",
          storyIds: ["s1", "s2"],
        },
        {
          name: "Vector Databases",
          summary: "Databases for embeddings",
          storyIds: ["s3"],
        },
      ],
      edges: [
        {
          source: "RAG",
          target: "Vector Databases",
          label: "builds on",
        },
      ],
    })

    const ai = new AIService(provider)
    const result = await Effect.runPromise(
      ai.synthesizeGraph({
        query: "rag",
        items: [
          { id: "s1", title: "Intro to RAG", summary: "a" },
          { id: "s2", title: "RAG deep dive", summary: "b" },
          { id: "s3", title: "Vector DB basics", summary: "c" },
        ],
      })
    )

    expect(result.concepts).toHaveLength(2)
    expect(result.concepts[0]).toMatchObject<SynthesizedConcept>({
      name: "RAG",
      summary: "Retrieval augmented generation",
      storyIds: ["s1", "s2"],
    })
    expect(result.edges[0]).toMatchObject<SynthesizedEdge>({
      source: "RAG",
      target: "Vector Databases",
      label: "builds on",
    })
  })
})

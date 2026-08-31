import { Context, Effect, Layer } from "effect"
import {
  ConceptRepository,
  ConceptEdgeRepository,
  ConceptStoryRepository,
} from "@weric/database"
import type { ConceptGraph } from "@weric/contracts"
import type { RepositoryError } from "@weric/database"

export interface GraphServiceShape {
  readonly getGraph: (
    chatId: string
  ) => Effect.Effect<ConceptGraph, RepositoryError>
}

export class GraphService extends Context.Tag("GraphService")<
  GraphService,
  GraphServiceShape
>() {}

export const GraphServiceLive = Layer.effect(
  GraphService,
  Effect.gen(function* () {
    const conceptRepo = yield* ConceptRepository
    const edgeRepo = yield* ConceptEdgeRepository
    const storyRepo = yield* ConceptStoryRepository

    return {
      getGraph: chatId =>
        Effect.gen(function* () {
          const [nodes, edges] = yield* Effect.all([
            conceptRepo.findByChat(chatId),
            edgeRepo.findByChat(chatId),
          ])

          const conceptStories: ConceptGraph["conceptStories"][number][] = []

          for (const node of nodes) {
            const storyIds = yield* storyRepo.findStoryIdsByConcept(node.id)
            for (const storyId of storyIds) {
              conceptStories.push({ conceptId: node.id, storyId })
            }
          }

          return { nodes, edges, conceptStories }
        }),
    }
  })
)

import { z } from "zod"

export const RelationType = z.enum([
  "mentions",
  "affiliated_with",
  "located_in",
  "acquired",
  "acquired_by",
  "collaborates_with",
  "competes_with",
  "employs",
  "employed_by",
  "funds",
  "funded_by",
  "related_to",
])
export type RelationType = z.infer<typeof RelationType>

export const RelationshipSchema = z.object({
  id: z.string().uuid(),
  sourceEntity: z.string().uuid(),
  targetEntity: z.string().uuid(),
  relationType: RelationType,
})
export type Relationship = z.infer<typeof RelationshipSchema>

export const CreateRelationshipInputSchema = z.object({
  sourceEntity: z.string().uuid(),
  targetEntity: z.string().uuid(),
  relationType: RelationType,
})
export type CreateRelationshipInput = z.infer<
  typeof CreateRelationshipInputSchema
>

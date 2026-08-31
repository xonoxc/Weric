# Plan: Concept Flow-Graph per Query (Weric)

## Goal

Redesign the query result so that instead of a flat grid of story cards, each query builds a **directional concept flow-graph** ("A leads to B" flowchart). Concept nodes are distilled from the discovered content and connected by dependency/flow edges; stories become drill-down detail under each concept. This replaces the current text/card dump with a navigable, contextual graph in the canvas.

## Confirmed decisions

- **Nodes**: concept nodes (distilled topics + summary), stories drill down under each concept
- **Edges**: directional flow/dependency edges ("A leads to B"), labeled
- **Scope**: per chat/query (each saved research session = one graph)
- **Rendering**: React Flow (`@xyflow/react`) with a DAG/top-down layout
- **Phased implementation**

---

## Phase 0 — Data model, contracts, AI primitive (foundation)

### Database (`packages/database`)

Add three tables to `src/schema/tables.ts` (pattern: FK + `cascade`), plus a migration:

- **`concepts`**: `id` (uuid pk), `chatId` (FK→chats, cascade), `name` (text, not null), `summary` (text), `positionX`/`positionY` (real, nullable — persisted layout), `createdAt`
- **`concept_edges`**: `id` (uuid pk), `chatId` (FK→chats, cascade), `sourceConcept` (FK→concepts, cascade), `targetConcept` (FK→concepts, cascade), `label` (text, e.g. "builds on", "motivates", "follows from"), `createdAt`
- **`concept_stories`**: join `conceptId` (FK→concepts, cascade) + `storyId` (FK→stories, cascade), composite pk

Add repositories (`src/repositories/`), wired like the existing `ChatRepository` (Context tag + Layer + barrel export in `src/repositories/index.ts` and `~db/...`):

- `ConceptRepository` — `create`, `findByChat`, `updatePosition`
- `ConceptEdgeRepository` — `create`, `findByChat`
- `ConceptStoryRepository` — `link`, `findStoryIdsByConcept`

### Contracts (`packages/contracts`)

Add `concept.ts` (+ export from barrel):

- `ConceptSchema` `{ id, chatId, name, summary, positionX?, positionY? }`
- `ConceptEdgeSchema` `{ id, sourceConcept, targetConcept, label }`
- `ConceptLinkSchema` `{ conceptId, storyId }`
- `ConceptGraphSchema` `{ nodes: ConceptSchema[], edges: ConceptEdgeSchema[], conceptStories: ConceptLinkSchema[] }` — the API response shape for a chat's graph.

### AI (`packages/ai`)

Add `ConceptGraphSchema`, `ConceptNodeSchema`, `ConceptEdgeInputSchema` to `validation.ts` and a method on `AIService`:

- `synthesizeGraph(context: { query: string; items: { id: string; title: string; summary: string }[] })` → `Effect<{ concepts: {name, summary, storyIds[]}[], edges: {from, to, label}[] }>`.
- Prompt instructs the model to: distill the sources into a concise set of distinct concepts (5–10), assign each source/story to the concept it best supports, and output **directional flow edges** describing conceptual dependency/sequence ("X builds on Y", "Z follows from X"). Schema constrains output to valid concept names/indices so it maps back to story ids server-side.

---

## Phase 1 — Backend graph construction (worker)

Modify `apps/worker/src/jobs/search-discover.ts`'s handler (and its constructor deps to also take `ConceptRepository`, `ConceptEdgeRepository`, `ConceptStoryRepository`, and `chatId` is already available):

1. After the existing per-page discovery loop persists stories and links them to the chat, **collect** the discovered story `(id, title, summary)` list.
2. Call `ai.synthesizeGraph({ query, items })`.
3. **Persist** for this `chatId`:
   - a `concepts` row per output concept;
   - a `concept_edges` row per directed edge (resolving names→ids);
   - a `concept_stories` link per `storyIds[]`.
4. **Stream graph progress to the client** via `postProgress(jobId, { progress, message, graph: { nodes, edges } })` so the graph builds live on the canvas (mirrors how `stories` are streamed today).
5. On completion set `status: "completed"` including final graph payload.
6. Keep existing behavior for chats without stories or on failure (post graceful errors, no graph).

Note: a fresh AIService already backs the worker; add the `synthesizeGraph` call in the same Effect composition with the existing `safe` error handling.

---

## Phase 2 — API layer

### Job-progress passthrough (`apps/api`)

- Extend `JobProgressSchema` in `apps/api/src/controllers/worker.controller.ts` to allow an optional `graph` field (nodes/edges/conceptStories) so the API relays the live graph to the browser over `/api/events`.

### New graph endpoint

- `routes/graph.router.ts` + `controllers/graph.controller.ts` + `services/graph.service.ts`: `GET /api/chats/:id/graph` → `{ nodes, edges, conceptStories }` built from the three repositories (ordered topologically or position-sorted). Auth-scoped to the chat's owner.
- Register in `app.ts`.
- Extend `GET /api/search` response to include `graph` (empty if none yet) so an initial render has structure before SSE fills in.

---

## Phase 3 — Frontend graph rendering (React Flow)

### Dependency

- Add `@xyflow/react` (+ its CSS) to `apps/web`. Add a layout stage using **dagre** for the top-down "flowchart" DAG layout.

### Data flow (`apps/web`)

- `api-client.ts`: add `fetchChatGraph(chatId)` → `GET /chats/:id/graph`; update `listenForJobEvents` to also accumulate `graph` from SSE.
- `hooks/useHome.ts`:
  - keep story assembly;
  - add graph state assembled from live SSE + `fetchChatGraph` on chat select/completion;
  - replace the `layoutStories` index-grid with a graph-driven layout (concept DAG via dagre; positions fed to React Flow).
  - Include story sub-nodes: each concept node groups its `concept_stories` (shown as child story identifiers/ports).

### Rendering (`packages/ui`)

- New `GraphCanvas` component (wraps React Flow `ReactFlow`, `Background`, `Controls`), used inside the center pane.
- Swap the current plain `<Canvas>` grid for the graph renderer; keep `Canvas`/`StoryCard` for non-graph contexts or repurpose.
- Custom `ConceptNode` (title + one-line summary + story count, expand affordance) and `FlowEdge` (SVG bezier with arrowhead + label). Cards get a pin point for edge attachment.
- Edge hover → highlight the connected subgraph; click node → drill into stories (see Phase 4).

---

## Phase 4 — Drill-down & interactions (completes the UX)

- **Concept drill-down**: clicking a concept opens/stays in the concept, and its stories appear in the right-side `StoryDetailPanel` (list of story cards) or expand beneath the node; selecting one story fills the existing full detail view (summary/entities/sources).
- **Edge semantics**: display the flow label on edges; hovering an edge shows a tooltip with the relation meaning.
- **CommandBar context**: wire the currently-cosmetic "Related Topics / Active Context / Sources" chips to the active graph's nodes/edges (concepts become selectable "active context"; sources list = concept stories' evidence).
- **ChatSidebar**: each saved chat already maps 1:1 to a graph; opening a chat loads its graph (Phase 2 endpoint). Show node/story counts.
- **Layout persistence**: after user drags nodes in React Flow, persist positions back via `concepts.updatePosition` (via the existing flow) so the graph stays stable across reloads.

---

## Open considerations / risks

- **AI edge quality**: flow edges depend on LLM synthesis; may occasionally be imperfect. Mitigate by validating concept names to known story ids and allowing a "related_to" fallback label.
- **Story counts per query**: currently capped at 5 sources; concept graphs are most meaningful with more sources — recommend raising the cap and/or making it configurable in a later phase.
- **Migration safety**: adding tables is additive/non-breaking; no existing table changes.
- **Testing**: Phase 2/1 should add a unit test for graph persistence + an AI-schema validation test (there is a `database` and `story-engine` test setup already; follow repo conventions).

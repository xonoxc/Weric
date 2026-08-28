export { TopBar } from "./components/top-bar.tsx"
export { Canvas } from "./components/canvas.tsx"
export { StoryCard } from "./components/story-card.tsx"
export { CommandBar } from "./components/command-bar.tsx"
export { JobStatusCard } from "./components/job-status-card.tsx"
export type { StoryCardData } from "./components/story-card.tsx"

// Primitives
export { cn } from "./utils/cn.ts"
export { Button, buttonVariants } from "./components/button.tsx"
export { Input } from "./components/input.tsx"
export { Separator } from "./components/seperator.tsx"
export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from "./components/sheet.tsx"
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./components/tooltip.tsx"
export { Skeleton } from "./components/skeleton.tsx"

export interface SseDiscoveredStory {
  id: string
  title: string
  slug: string
  summary: string
  confidence: number
}

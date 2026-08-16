import { defineConfig } from "vitest/config"
import { resolve } from "path"

export default defineConfig({
  resolve: {
    alias: {
      "~worker": resolve(__dirname, "src"),
      "~db": resolve(__dirname, "../../packages/database/src"),
      "~ai": resolve(__dirname, "../../packages/ai/src"),
    },
  },
  test: {
    fileParallelism: false,
  },
})

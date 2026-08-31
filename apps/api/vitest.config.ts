import { defineConfig } from "vitest/config"
import { resolve } from "path"

export default defineConfig({
  resolve: {
    alias: {
      "~api": resolve(__dirname, "src"),
      "~db": resolve(__dirname, "../../packages/database/src"),
      "~ai": resolve(__dirname, "../../packages/ai/src"),
      "~worker": resolve(__dirname, "../worker/src"),
    },
  },
  test: {
    fileParallelism: false,
  },
})

import { defineConfig } from "vitest/config"
import { resolve } from "path"

export default defineConfig({
  resolve: {
    alias: {
      "~rec": resolve(__dirname, "src"),
      "~db": resolve(__dirname, "../database/src"),
    },
  },
  test: {
    fileParallelism: false,
  },
})

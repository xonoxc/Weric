import { defineConfig } from "vitest/config"
import { resolve } from "path"
import { TEST_DATABASE_URL } from "@weric/shared"

export default defineConfig({
  resolve: {
    alias: {
      "~db": resolve(__dirname, "src"),
    },
  },
  test: {
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
    },
    fileParallelism: false,
  },
})

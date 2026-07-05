import { defineConfig } from "vitest/config"
import { resolve } from "path"

export default defineConfig({
  resolve: {
    alias: {
      "~": resolve(__dirname, "src"),
    },
  },
  test: {
    env: {
      DATABASE_URL: "postgresql://weric:weric@localhost:5432/weric_test",
    },
    fileParallelism: false,
  },
})

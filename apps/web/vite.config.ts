import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { resolve } from "path"

export default defineConfig({
  resolve: {
    alias: {
      "~web": resolve(__dirname, "src"),
    },
  },
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        configure: (_proxy, _options) => {
          _proxy.on("error", () => {
            console.log("API server not available — using mock data")
          })
        },
      },
    },
  },
})

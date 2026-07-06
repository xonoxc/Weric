import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
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

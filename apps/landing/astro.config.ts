import { defineConfig } from "astro/config"
import tailwindcss from "@tailwindcss/vite"
import react from "@astrojs/react"

export default defineConfig({
  site: "https://weric.dev",
  integrations: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler", {}]],
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
})

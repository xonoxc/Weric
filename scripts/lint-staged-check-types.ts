import { execSync } from "node:child_process"

const files = process.argv.slice(2)
const packages = new Set<string>()

for (const file of files) {
  // Extract package path from file: packages/shared/src/foo.ts -> packages/shared
  // or apps/api/src/foo.ts -> apps/api
  const match = file.match(/^(packages\/[^/]+|apps\/[^/]+)\//)
  if (match) {
    packages.add(match[1]!)
  }
}

if (packages.size === 0) process.exit(0)

const filterArgs = [...packages].map(p => `--filter=./${p}`).join(" ")
const cmd = `bun run check-types ${filterArgs}`

try {
  execSync(cmd, { stdio: "inherit" })
} catch {
  process.exit(1)
}

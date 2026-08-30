import { loadDatabaseUrl } from "@weric/config"

export interface DatabaseConfig {
  url: string
}

export function loadDatabaseConfig(url?: string): DatabaseConfig {
  return { url: loadDatabaseUrl(url) }
}

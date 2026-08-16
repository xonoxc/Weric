import { useQuery } from "@tanstack/react-query"
import { fetchProfile } from "~web/lib/api-client.ts"

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile(),
  })
}

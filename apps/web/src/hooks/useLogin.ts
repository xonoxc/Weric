import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { signIn, useSession } from "../lib/auth-client.ts"
import { attempt } from "../lib/result.ts"

export function useLogin() {
  const navigate = useNavigate()
  const { data: session, isPending: sessionLoading } = useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await attempt(() => signIn.email({ email, password }))

    if (!result.ok) {
      setError(result.error.message ?? "Connection failed")
      setLoading(false)
      return
    }

    if (result.data.error) {
      setError(
        result.data.error.message ??
          result.data.error.statusText ??
          "Invalid credentials"
      )
      setLoading(false)
      return
    }

    navigate("/", { replace: true })
    setLoading(false)
  }

  const signInWithProvider = async (provider: "github" | "google") => {
    setError("")
    setSocialLoading(provider)

    const result = await attempt(() =>
      signIn.social({ provider, callbackURL: "/" })
    )

    if (!result.ok) {
      setError(result.error.message ?? "Connection failed")
    } else if (result.data?.error) {
      setError(
        result.data.error.message ??
          result.data.error.statusText ??
          `${provider} sign-in failed`
      )
    }

    setSocialLoading(null)
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    loading,
    socialLoading,
    session,
    sessionLoading,
    handleSubmit,
    signInWithProvider,
  }
}

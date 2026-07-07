import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { signUp, useSession } from "../lib/auth-client.ts"
import { attempt } from "../lib/result.ts"

export function useSignup() {
  const navigate = useNavigate()
  const { data: session, isPending: sessionLoading } = useSession()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await attempt(() => signUp.email({ name, email, password }))

    if (!result.ok) {
      setError(result.error.message ?? "Connection failed")
      setLoading(false)
      return
    }

    if (result.data.error) {
      setError(
        result.data.error.message ??
          result.data.error.statusText ??
          "Registration failed"
      )
      setLoading(false)
      return
    }

    navigate("/onboarding", { replace: true })
    setLoading(false)
  }

  return {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    error,
    loading,
    session,
    sessionLoading,
    handleSubmit,
  }
}

import { AxiosError, type AxiosResponse } from "axios"

export type ExpectedError = {
  status: number
  message: string
}

type Ok<T> = { ok: true; data: T }
type Err<E> = { ok: false; error: E }
export type Result<T, E = ExpectedError | Error> = Ok<T> | Err<E>

export function ok<T>(data: T): Ok<T> {
  return { ok: true, data }
}

export function err<E>(error: E): Err<E> {
  return { ok: false, error }
}

type AttemptArg<T> = () => Promise<T | AxiosResponse<T>>

async function attempt<T, E = ExpectedError | Error>(
  fn: AttemptArg<T>,
  opts?: { onTearDown?: () => void }
): Promise<Result<T, E>> {
  try {
    const result = await fn()
    const data = isAxiosResponse(result) ? result.data : result
    return ok(data as T)
  } catch (error: any) {
    if (error instanceof AxiosError) {
      const axiosError = handleAxiosError(error)
      if (axiosError) return err(axiosError as E)
    }
    return err(error as E)
  } finally {
    opts?.onTearDown?.()
  }
}

async function andThenAsync<T, E, U>(
  result: Promise<Result<T, E>> | Result<T, E>,
  fn: (value: T) => Promise<Result<U, E>>
): Promise<Result<U, E>> {
  const resolved = await result
  if (!resolved.ok) return resolved
  return fn(resolved.data)
}

function isAxiosResponse<T>(res: any): res is AxiosResponse<T> {
  return (
    res &&
    typeof res === "object" &&
    "data" in res &&
    "status" in res &&
    "headers" in res
  )
}

function attemptSync<T, E = Error>(fn: () => T): Result<T, E> {
  try {
    return ok(fn())
  } catch (error: any) {
    return err(error as E)
  }
}

function andThen<T, E, U>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (!result.ok) return result
  return fn(result.data)
}

function handleAxiosError(error: any): ExpectedError | undefined {
  if (error.response) {
    const contentType = error.response.headers["content-type"]
    const errorStatus = error.response.status

    if (contentType && contentType.includes("application/json")) {
      const serverMessage =
        error.response.data.message ||
        error.response.data.error ||
        JSON.stringify(error.response.data)

      return { status: errorStatus, message: serverMessage }
    } else {
      return {
        status: errorStatus,
        message: "Internal server error. please try again later!",
      }
    }
  }
}

export { attempt, attemptSync, andThen, andThenAsync }

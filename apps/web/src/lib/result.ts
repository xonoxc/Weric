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

async function attempt<T, E = ExpectedError | Error>(
  fn: () => Promise<T>,
  opts?: { onTearDown?: () => void }
): Promise<Result<T, E>> {
  try {
    const data = await fn()
    return ok(data)
  } catch (error: unknown) {
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

function attemptSync<T, E = Error>(fn: () => T): Result<T, E> {
  try {
    return ok(fn())
  } catch (error: unknown) {
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

export { attempt, attemptSync, andThen, andThenAsync }

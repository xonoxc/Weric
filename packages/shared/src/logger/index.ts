import { Context, Effect, Layer } from "effect"
import pino from "pino"

export interface Logger {
  readonly trace: (
    message: string,
    context?: Record<string, unknown>
  ) => Effect.Effect<void>
  readonly debug: (
    message: string,
    context?: Record<string, unknown>
  ) => Effect.Effect<void>
  readonly info: (
    message: string,
    context?: Record<string, unknown>
  ) => Effect.Effect<void>
  readonly warn: (
    message: string,
    context?: Record<string, unknown>
  ) => Effect.Effect<void>
  readonly error: (
    message: string,
    context?: Record<string, unknown>
  ) => Effect.Effect<void>
  readonly fatal: (
    message: string,
    context?: Record<string, unknown>
  ) => Effect.Effect<void>
  readonly child: (bindings: Record<string, unknown>) => Logger
}

export class LoggerService extends Context.Tag("LoggerService")<
  LoggerService,
  Logger
>() {}

function createPinoLoggerInstance(): Logger {
  const instance: pino.Logger = pino({
    level: process.env.LOG_LEVEL ?? "info",
  })

  return {
    trace: (message, context) =>
      Effect.sync(() => instance.trace(context ?? {}, message)),
    debug: (message, context) =>
      Effect.sync(() => instance.debug(context ?? {}, message)),
    info: (message, context) => Effect.sync(() => instance.info(context ?? {}, message)),
    warn: (message, context) => Effect.sync(() => instance.warn(context ?? {}, message)),
    error: (message, context) =>
      Effect.sync(() => instance.error(context ?? {}, message)),
    fatal: (message, context) =>
      Effect.sync(() => instance.fatal(context ?? {}, message)),
    child: bindings => createPinoLoggerFrom(instance.child(bindings)),
  }
}

function createPinoLoggerFrom(instance: pino.Logger): Logger {
  return {
    trace: (message, context) =>
      Effect.sync(() => instance.trace(context ?? {}, message)),
    debug: (message, context) =>
      Effect.sync(() => instance.debug(context ?? {}, message)),
    info: (message, context) => Effect.sync(() => instance.info(context ?? {}, message)),
    warn: (message, context) => Effect.sync(() => instance.warn(context ?? {}, message)),
    error: (message, context) =>
      Effect.sync(() => instance.error(context ?? {}, message)),
    fatal: (message, context) =>
      Effect.sync(() => instance.fatal(context ?? {}, message)),
    child: bindings => createPinoLoggerFrom(instance.child(bindings)),
  }
}

export const LoggerLiveLayer: Layer.Layer<LoggerService> = Layer.effect(
  LoggerService,
  Effect.sync(() => createPinoLoggerInstance())
)

export function createTestLogger(): Logger {
  return {
    trace: () => Effect.void,
    debug: () => Effect.void,
    info: () => Effect.void,
    warn: () => Effect.void,
    error: () => Effect.void,
    fatal: () => Effect.void,
    child: () => createTestLogger(),
  }
}

export const LoggerTestLayer: Layer.Layer<LoggerService> = Layer.effect(
  LoggerService,
  Effect.sync(() => createTestLogger())
)

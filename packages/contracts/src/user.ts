import { Schema } from "effect"

export const UserSchema = Schema.Struct({
  id: Schema.UUID,
  name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100)),
  email: Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
  emailVerified: Schema.Boolean,
  image: Schema.NullOr(Schema.String),
  username: Schema.NullOr(Schema.String),
  displayUsername: Schema.NullOr(Schema.String),
  createdAt: Schema.String,
  updatedAt: Schema.String,
})
export type User = Schema.Schema.Type<typeof UserSchema>

export const CreateUserInputSchema = Schema.Struct({
  name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100)),
  email: Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
  password: Schema.String.pipe(Schema.minLength(8), Schema.maxLength(128)),
  username: Schema.optional(
    Schema.String.pipe(Schema.minLength(3), Schema.maxLength(30))
  ),
})
export type CreateUserInput = Schema.Schema.Type<typeof CreateUserInputSchema>

export const UpdateUserInputSchema = Schema.Struct({
  name: Schema.optional(
    Schema.String.pipe(Schema.minLength(1), Schema.maxLength(100))
  ),
  username: Schema.optional(
    Schema.String.pipe(Schema.minLength(3), Schema.maxLength(30))
  ),
})
export type UpdateUserInput = Schema.Schema.Type<typeof UpdateUserInputSchema>

export const LoginInputSchema = Schema.Struct({
  email: Schema.String.pipe(Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)),
  password: Schema.String.pipe(Schema.minLength(1)),
})
export type LoginInput = Schema.Schema.Type<typeof LoginInputSchema>

export const AuthSessionSchema = Schema.Struct({
  user: UserSchema,
  session: Schema.Struct({
    id: Schema.UUID,
    userId: Schema.UUID,
    token: Schema.String,
    expiresAt: Schema.String,
    ipAddress: Schema.NullOr(Schema.String),
    userAgent: Schema.NullOr(Schema.String),
    createdAt: Schema.String,
    updatedAt: Schema.String,
  }),
})
export type AuthSession = Schema.Schema.Type<typeof AuthSessionSchema>

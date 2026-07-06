import { z } from "zod"

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  username: z.string().nullable(),
  displayUsername: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type User = z.infer<typeof UserSchema>

export const CreateUserInputSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  username: z.string().min(3).max(30).optional(),
})
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>

export const UpdateUserInputSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  username: z.string().min(3).max(30).optional(),
})
export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>

export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
export type LoginInput = z.infer<typeof LoginInputSchema>

export const AuthSessionSchema = z.object({
  user: UserSchema,
  session: z.object({
    id: z.string(),
    userId: z.string(),
    token: z.string(),
    expiresAt: z.string().datetime(),
    ipAddress: z.string().nullable(),
    userAgent: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }),
})
export type AuthSession = z.infer<typeof AuthSessionSchema>

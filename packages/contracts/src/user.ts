import { z } from "zod"

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string().min(2).max(50),
  createdAt: z.string().datetime(),
})
export type User = z.infer<typeof UserSchema>

export const CreateUserInputSchema = z.object({
  email: z.string().email(),
  username: z.string().min(2).max(50),
  password: z.string().min(8).max(128),
})
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>

export const UpdateUserInputSchema = z.object({
  username: z.string().min(2).max(50).optional(),
  email: z.string().email().optional(),
})
export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>

export const LoginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
export type LoginInput = z.infer<typeof LoginInputSchema>

export const AuthTokenSchema = z.object({
  token: z.string(),
  user: UserSchema,
})
export type AuthToken = z.infer<typeof AuthTokenSchema>

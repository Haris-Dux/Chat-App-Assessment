import { z } from 'zod';

export const loginSchema = z.object({
  businessSlug: z.string().min(1),
  email: z.email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password').max(128),
});

export const signupSchema = loginSchema.extend({
  fullName: z.string().trim().min(2, 'Enter your name').max(80),
  password: z.string().min(8, 'Use at least 8 characters').max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;

export interface User {
  id: string;
  businessId: string;
  email: string;
  fullName: string;
}

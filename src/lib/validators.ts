import { z } from "zod";

import type { UserRole } from "@/lib/supabase/database.types";

export const roleSchema = z.enum(["customer", "worker"]);

export const signupSchema = z.object({
  fullName: z
    .string({ message: "Full name is required" })
    .min(2, { message: "Name must be at least 2 characters" })
    .trim(),
  email: z.string().trim().email({ message: "Enter a valid email address" }),
  password: z
    .string({ message: "Password is required" })
    .min(8, { message: "Password must be at least 8 characters" }),
  phone: z
    .string({ message: "Phone number is required" })
    .min(7, { message: "Enter a valid phone number" })
    .trim(),
  role: roleSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email address" }),
  password: z.string({ message: "Password is required" }).min(1),
});

export const phoneSchema = z
  .string()
  .min(7, { message: "Enter a valid phone number" })
  .trim();

export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type { UserRole };

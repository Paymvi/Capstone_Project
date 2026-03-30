import { z } from "zod";

export const registerSchema = z.object({
    username: z.string().min(3).max(50),
    password: z.string().min(6).max(100)
});

export const loginSchema = z.object({
    username: z.string().min(3).max(50),
    password: z.string().min(6).max(100)
});
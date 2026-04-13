import { z } from "zod";

export const registerSchema = z.object({
    username: z.string()
        .min(8)
        .max(50)
        .regex(/^[a-zA-Z0-9_]+$/),
    password: z.string()
        .min(5)
        .max(50)
        .regex(/[A-Z]/, "Must include uppercase")
        .regex(/[a-z]/, "Must include lowercase")
        .regex(/[0-9]/, "Must include number")
});

export const loginSchema = z.object({
    username: z.string()
        .min(8)
        .max(50)
        .regex(/^[a-zA-Z0-9_]+$/),
    password: z.string()
        .min(5)
        .max(50)
        .regex(/[A-Z]/, "Must include uppercase")
        .regex(/[a-z]/, "Must include lowercase")
        .regex(/[0-9]/, "Must include number")
});
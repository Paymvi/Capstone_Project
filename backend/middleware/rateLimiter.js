import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: {
        error: "Too many login attempts. Please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

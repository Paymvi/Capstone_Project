import rateLimit, { ipKeyGenerator } from "express-rate-limit";

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: {
        error: "Too many login attempts. Please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, //only counts failed logins

    // Combine IP + username to prevent attacks toward multiple usernames 
    // from one IP 
    keyGenerator: (req) => {
        const ip = ipKeyGenerator(req); 
        const username = req.body?.username || "unknown";
        return `${ip}-${username}`;
    },

    // Logs rate limit to the security log page
    handler: (req, res) => {
        console.warn(`RATE LIMIT TRIGGERED: ${req.ip}`);

        return res.status(429).json({
            error: "Too many login attempts. Please try again later."
        });
    }
});

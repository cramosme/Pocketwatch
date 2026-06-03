import rateLimit from "express-rate-limit";

// A general limiter applied to all api routes
// More allowed requests than plaid calls
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  max: 100,                 // max requests per window per ip
  standardHeaders: true,    // adds retry header to responses
  legacyHeaders: false,     // disables old headers

  // Override to use error shape defined in handler
  handler: (req, res) => {
    res.status(409).json({
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please try again later.",
      },
    });
  },
});

// A more strict limiter for Plaid endpoints since they charge per api call
export const plaidLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res) => {
    res.status(409).json({
      error: {
        code: "RATE_LIIMITED",
        message: "Too many requests. Please try again later.",
      },
    });
  },
});

export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please try again later.",
      },
    });
  },
});
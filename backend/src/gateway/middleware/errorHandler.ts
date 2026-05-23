import { Request, Response, NextFunction } from "express";

// Catches any uncaught error from routes and middleware
// Logs full details server-side for debugging while also
// returning a sanitized response to client to avoid stack leaks
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {

  // Log to the server
  console.error("Unhandled error:", {
    path: req.path,
    method: req.method,
    userId: req.userId,
    message: err.message,
    stack: err.stack,
  });

  // Shows full error in dev, sanitized during production
  const isDevelopment = process.env.NODE_ENV !== "production";

  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: isDevelopment
        ? err.message
        : "Something went wrong. Please try again.",
      ...(isDevelopment && {stack: err.stack}),
    }
  });
}
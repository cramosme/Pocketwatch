// Extends Express's Request type with custom properties added by
// our middleware. After requireAuth runs, req.userId is the
// authenticated user's UUID.
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export {};
import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../../database/supabase";

// Middleware that verifies the user's JWT and attaches their user_id
// to the request. Applies to any route that requires authentication.
// On success: calls next() and req.userId is populated.
// On failure: returns 401 with a JSON error, never calls next().
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {

  // Extract the token from the authorization header (Ex: Bearer: <token>)
  const authHeader = req.headers.authorization;

  // Make sure it is valid, and starts in correct format
  if( !authHeader || !authHeader.startsWith("Bearer ")){
    console.warn("Auth failure: missing or malformed header", {
      path: req.path,
      method: req.method,
      ip: req.ip,
    });
    res.status(401).json({
      error:{
        code: "MISSING_AUTH_TOKEN",
        message: "Authorization header missing or malformed"
      },
    });
    return;
  }

  // Pull the token out from string
  const token = authHeader.substring("Bearer ".length);

  // Verify token through supabase. Valid token returns the user
  // Otherwise return error
  const {data, error} = await supabaseAdmin.auth.getUser(token);

  if( error || !data.user ){
    console.warn("Auth failure: invalid token", {
      path: req.path,
      method: req.method,
      ip: req.ip,
      supabaseError: error?.message,
    });
    res.status(401).json({
      error:{
        code: "INVALID_AUTH_TOKEN",
        message: "Token is invalid or expired"
      },
    });
    return;
  }

  // Attach the user Id to the request for other handlers
  req.userId = data.user.id;

  // Pass control to the next handler
  next();
}
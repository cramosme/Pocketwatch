import { Request, Response, NextFunction } from "express";
import {
  createLinkToken,
  exchangePublicToken,
} from "../../services/plaid/plaid.service";
import { runInitialSync } from "../../services/plaid/sync.service";
import { ServiceError } from "../../lib/errors";

// POST /api/plaid/link-token
// Creates a temporary Link token for the authenticated user
// Mobile uses it to open up the Plaid Link UI, where they can pick a bank and login
export async function createLinkTokenHandler(
  req: Request,
  res: Response,
  next: NextFunction
) : Promise<void> {
  try{
    // requireAuth guarantees userId at runtime but typescript needs it explicitly
    // checked here
    const userId = req.userId;
    if( !userId ){
      res.status(401).json({
        error: { code: "MISSING_AUTH_TOKEN", message: "Not authenticated" },
      });
      return;
    }
    
    const result = await createLinkToken(userId);
    res.json(result);
  } catch ( err ){
    next(err); // Let ServiceError handle it
  }
}

// POST /api/plaid/exchange-public-token
// Swaps the public token plaid link hands back for permanent access token
export async function exchangePublicTokenHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({
        error: { code: "MISSING_AUTH_TOKEN", message: "Not authenticated" },
      });
      return;
    }

    const { publicToken, institution } = req.body ?? {};

    if (typeof publicToken !== "string" || publicToken.length === 0) {
      res.status(400).json({
        error: {
          code: "INVALID_REQUEST",
          message: "publicToken is required and must be a string",
        },
      });
      return;
    }

    if (
      typeof institution !== "object" ||
      institution === null ||
      typeof institution.id !== "string" ||
      typeof institution.name !== "string"
    ) {
      res.status(400).json({
        error: {
          code: "INVALID_REQUEST",
          message: "institution must include a string id and name",
        },
      });
      return;
    }

    const result = await exchangePublicToken(userId, publicToken, {
      id: institution.id,
      name: institution.name,
    });

    // Run initial sync separately from the exchange. Connection success and sync
    // success are different events. A sync failure doesn't undo the connection.
    // return 201 so the bank shows as connected regardless of sync outcome.
    try {
      await runInitialSync(result.plaidItemId, userId);
    } catch (err) {
      console.error("[plaid.controller] initial sync failed after exchange", {
        plaidItemId: result.plaidItemId,
        error: err instanceof ServiceError ? err.code : err,
      });
    }

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
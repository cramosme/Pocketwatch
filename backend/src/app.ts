import cors from 'cors';
import express, { Application } from 'express';
import router from './gateway/router';
import { errorHandler } from "./gateway/middleware/errorHandler";
import { generalLimiter, webhookLimiter } from "./gateway/middleware/rateLimiter";
import { verifyWebhook } from "./services/plaid/webhook.service";

// Express application, this is the starting point of application logic 
// that is served by the loop in server.ts. 
const app: Application = express();

// Plaid webhook. Registered BEFORE app.use(express.json()) so express.raw leaves
// req.body as the exact bytes Plaid hashed. requireAuth is intentionally absent
// the JWT signature IS this endpoint's authentication.
app.post(
  "/api/webhooks/plaid",
  webhookLimiter,
  express.raw({ type: "application/json", limit: "10kb" }),
  async (req, res, next) => {
    let payload;
    try {
      payload = await verifyWebhook(req.header("Plaid-Verification"), req.body);
    } catch (err) {
      return next(err); // verification failure -> 401 via the global handler
    }

    // Ack immediately. Plaid retries on non-2xx and times out slow responses,
    // so we never make it wait on the work that follows.
    res.sendStatus(200);

    // Post-ack dispatch goes here (Commit 4b). It must own its own error
    // handling — the response is already sent, so next() is no longer an option.
    // await dispatchWebhook(payload);
  }
);

// Middleware
app.use(cors());
app.use(express.json());

// Apply general limiter to all /api routes
app.use("/api", generalLimiter);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Pocketwatch API'
  });
});

// Mount our express router at /api. All api calls will start at /api/....
app.use('/api', router); 

// Mount error handler last
app.use(errorHandler);

export default app;
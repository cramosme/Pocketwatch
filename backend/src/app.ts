import cors from 'cors';
import express, { Application } from 'express';
import router from './gateway/router';
import { errorHandler } from "./gateway/middleware/errorHandler";
import { generalLimiter } from "./gateway/middleware/rateLimiter";

// Express application, this is the starting point of application logic 
// that is served by the loop in server.ts. 
const app: Application = express();

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
import cors from 'cors';
import express, { Application } from 'express';
import router from './gateway/router';

// Express application, this is the starting point of application logic 
// that is served by the loop in server.ts. 
const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic health check endpoint, hit it as a sanity check when other
// endpoints fail. 
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Pocketwatch API'
  });
});

// Mount our express router at /api. All api calls will start at /api/....
app.use('/api', router); 

export default app;
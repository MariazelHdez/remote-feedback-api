import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import path from 'path';
import { doHealthCheck } from "./utils/healthCheck";
import * as config from './config';

const app = express();
const sufixPath = '/index.html';

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

app.use(
    helmet.contentSecurityPolicy({
      directives: {
        'default-src': [ "'self'" ],
        'base-uri': [ "'self'" ],
        'block-all-mixed-content': [],
        'font-src': [ "'self'", 'https:', 'data:' ],
        'frame-ancestors': [ "'self'" ],
        'img-src': [
          "'self'",
          'data:',
          'https://a.tile.openstreetmap.org',
          'https://b.tile.openstreetmap.org',
          'https://c.tile.openstreetmap.org',
        ],
        'object-src': [ "'none'" ],
        'script-src': [ "'self'" ],
        'script-src-attr': [ "'none'" ],
        'style-src': [ "'self'", 'https:', "'unsafe-inline'" ],
        'worker-src': ["'self'", 'blob:'],
        'connect-src': [
          "'self'",
          'https://eservices.gov.yk.ca',
        ],
      },
    })
);

// very basic CORS setup
app.use(cors({
  origin: config.FRONTEND_URL,
  optionsSuccessStatus: 200,
  credentials: false
}));

app.get("/api/healthCheck", (req: Request, res: Response) => {
  doHealthCheck(res);
});

app.use("/api/remote-feedback", remoteFeedbackRouter);


// set up rate limiter: maximum of five requests per minute
var RateLimit = require('express-rate-limit');
var limiter = RateLimit({
  windowMs: 1*60*1000, // 1 minute
  max: 5000
});

// apply rate limiter to all requests
app.use(limiter);

// serves the static files generated by the front-end
app.use(express.static(path.join(__dirname, "web")));

// if no other routes match, just send the front-end
app.use((req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "web") + sufixPath);
});

app.listen(config.API_PORT, () => {
  console.log(`API listenting on port ${config.API_PORT}`);
});
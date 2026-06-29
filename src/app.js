import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import passport from './config/passport.js';
import { sessionMiddleware } from './config/session.js';
import { security } from './middleware/security.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Render/Neon sit behind a proxy; trust it so secure cookies + rate limiting work.
app.set('trust proxy', 1);

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Security + parsing
app.use(security);
app.use(globalLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static assets
app.use(express.static(path.join(__dirname, 'public')));

// Session + auth (order matters: session must come before passport.session)
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/', routes);

// 404 then centralized error handler — always last.
app.use(notFound);
app.use(errorHandler);

export default app;

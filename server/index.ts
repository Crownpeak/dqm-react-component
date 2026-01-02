// Express Backend Server for DQM React Component
import express, {type Response} from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import {fileURLToPath} from 'url';
import {authRouter} from './routes/auth.js';
import {dqmRouter} from './routes/dqm.js';
import {errorHandler} from './middleware/errorHandler.js';
import {config} from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = __dirname.includes('/server') && !__dirname.includes('/dist/');

const app = express();

const applyDevNoStoreHeaders = (res: Response) => {
    if (!isDev) {
        return;
    }
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
};

// Security middleware - Allow auth UI to load
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: isDev ? ["'self'", "'unsafe-inline'"] : ["'self'"],
            connectSrc: ["'self'"],
        },
    },
}));

console.log('[Server] CORS allowed origins:', config.corsOrigins);

// CORS configuration
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({extended: true, limit: '10mb'}));

// Request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({status: 'ok', timestamp: new Date().toISOString()});
});

// Serve Auth UI static files
// Detect if running from source (dev) or compiled (prod)
const authUiPath = isDev
    ? path.join(__dirname, '..', 'dist', 'auth-ui')  // Dev: server/ -> dist/auth-ui
    : path.join(__dirname, '..', 'auth-ui');          // Prod: dist/server/ -> dist/auth-ui

console.log('[Server] Running in:', isDev ? 'DEVELOPMENT' : 'PRODUCTION');
console.log('[Server] Auth UI path:', authUiPath);

app.use(
    '/auth',
    express.static(authUiPath, {
        setHeaders: (res) => applyDevNoStoreHeaders(res as Response),
    })
);
app.use(
    '/assets',
    express.static(path.join(authUiPath, 'assets'), {
        setHeaders: (res) => applyDevNoStoreHeaders(res as Response),
    })
);

// Serve index.html for auth routes (SPA routing)
app.get('/auth/login', (req, res) => {
    applyDevNoStoreHeaders(res);
    res.sendFile(path.join(authUiPath, 'index.html'));
});

app.get('/auth/callback', (req, res) => {
    applyDevNoStoreHeaders(res);
    res.sendFile(path.join(authUiPath, 'index.html'));
});

// API routes
app.use('/auth', authRouter);
app.use('/dqm', dqmRouter);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
    console.log(`🚀 DQM Backend API running on http://localhost:${PORT}`);
    console.log(`📝 Health check: http://localhost:${PORT}/health`);
});

export default app;

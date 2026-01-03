import {fileURLToPath} from "url";
import {dirname, extname, resolve} from "path";
import {IncomingMessage, ServerResponse} from "http";
import * as fs from "node:fs";

type SessionData = {
    apiKey: string;
    websiteId: string;
    userId?: string;
    createdAt: number;
    expiresAt: number;
};

type BackendDeps = {
    config: {
        corsOrigins: string[];
        port: number;
        session: {
            ttl: number;
        };
    };
    sessionStore: {
        create: (apiKey: string, websiteId: string, userId?: string) => Promise<string>;
        get: (token: string) => Promise<SessionData | null>;
        delete: (token: string) => Promise<boolean>;
        extend: (token: string) => Promise<boolean>;
        count: () => Promise<number>;
    };
    DQMClient: new (apiKey: string, websiteId: string) => {
        validateCredentials: () => Promise<boolean>;
        createAsset: (data: { html: string; url?: string; websiteId?: string }) => Promise<any>;
        getAssetStatus: (assetId: string) => Promise<any>;
        getPageHighlightAll: (assetId: string) => Promise<string>;
        getPageHighlightCheckpoint: (assetId: string, checkpointId: string, highlightSource?: boolean) => Promise<string>;
    };
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const authUiPath = resolve(__dirname, 'dist', 'auth-ui');
const authUiIndexPath = resolve(authUiPath, 'index.html');

const MAX_BODY_BYTES = 10 * 1024 * 1024;

const contentTypes: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
};

const authUiCsp = [
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "script-src 'self'",
    "connect-src 'self'",
].join('; ');

const getContentType = (filePath: string) => contentTypes[extname(filePath).toLowerCase()] || 'application/octet-stream';

const sendJson = (res: ServerResponse, status: number, data: unknown) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
};

const sendText = (res: ServerResponse, status: number, message: string) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(message);
};

const applyAuthUiHeaders = (res: ServerResponse) => {
    res.setHeader('Content-Security-Policy', authUiCsp);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
};

const applyCors = (req: IncomingMessage, res: ServerResponse, allowedOrigins: string[]) => {
    const origin = req.headers.origin;
    if (!origin || !allowedOrigins.includes(origin)) {
        return;
    }

    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
};

const handlePreflight = (req: IncomingMessage, res: ServerResponse, allowedOrigins: string[]) => {
    applyCors(req, res, allowedOrigins);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');
    res.statusCode = 204;
    res.end();
};

const readBody = async (req: IncomingMessage): Promise<Buffer> => {
    return new Promise((resolveBody, reject) => {
        const chunks: Buffer[] = [];
        let size = 0;

        req.on('data', (chunk: Buffer) => {
            size += chunk.length;
            if (size > MAX_BODY_BYTES) {
                reject(new Error('Payload too large'));
                req.destroy();
                return;
            }
            chunks.push(chunk);
        });
        req.on('end', () => resolveBody(Buffer.concat(chunks)));
        req.on('error', reject);
    });
};

const parseBody = async (req: IncomingMessage, res: ServerResponse) => {
    try {
        const body = await readBody(req);
        const raw = body.toString('utf-8');
        const contentType = req.headers['content-type'] || '';

        if (contentType.includes('application/json')) {
            return raw ? JSON.parse(raw) : {};
        }
        if (contentType.includes('application/x-www-form-urlencoded')) {
            return Object.fromEntries(new URLSearchParams(raw));
        }

        return raw;
    } catch (error) {
        if (error instanceof Error && error.message === 'Payload too large') {
            sendJson(res, 413, { error: true, message: 'Payload too large' });
            return null;
        }
        sendJson(res, 400, { error: true, message: 'Invalid request body' });
        return null;
    }
};

const sendFile = (req: IncomingMessage, res: ServerResponse, filePath: string) => {
    try {
        const stat = fs.statSync(filePath);
        if (!stat.isFile()) {
            return false;
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', getContentType(filePath));
        res.setHeader('Content-Length', stat.size.toString());

        if (req.method === 'HEAD') {
            res.end();
            return true;
        }

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
        stream.on('error', () => {
            if (!res.headersSent) {
                sendText(res, 500, 'File read error');
            }
        });
        return true;
    } catch (error) {
        return false;
    }
};

export const devBackendPlugin = () => {
    let depsPromise: Promise<BackendDeps> | null = null;
    let hasLogged = false;

    const loadDeps = () => {
        if (!depsPromise) {
            depsPromise = Promise.all([
                import('./server/config.ts'),
                import('./server/services/sessionStore.ts'),
                import('./server/services/dqmClient.ts'),
            ]).then(([configMod, sessionMod, dqmMod]) => ({
                config: configMod.config,
                sessionStore: sessionMod.sessionStore,
                DQMClient: dqmMod.DQMClient,
            }));
        }
        return depsPromise;
    };

    const logStartup = async (port: number) => {
        const {config} = await loadDeps();
        if (hasLogged) return;
        hasLogged = true;
        console.log('[Vite Backend] Running in DEVELOPMENT');
        console.log('[Vite Backend] Auth UI path:', authUiPath);
        console.log('[Vite Backend] CORS allowed origins:', config.corsOrigins);
        console.log(`[Vite Backend] API ready on http://localhost:${port}`);
        console.log(`[Vite Backend] Health check: http://localhost:${port}/health`);
    };

    return {
        name: 'vite-dev-backend',
        configureServer(server: any) {
            void loadDeps();
            server.httpServer?.once('listening', () => {
                const address = server.httpServer?.address();
                const port = typeof address === 'object' && address ? address.port : 5173;
                void logStartup(port);
            });

            server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
                void (async () => {
                    if (!req.url) {
                        return next();
                    }

                    const url = new URL(req.url, 'http://localhost');
                    const pathname = url.pathname;
                    const method = (req.method || 'GET').toUpperCase();

                    const isApiPath = pathname.startsWith('/auth') || pathname.startsWith('/dqm') || pathname.startsWith('/assets') || pathname === '/health';
                    if (!isApiPath) {
                        return next();
                    }

                    const {config, sessionStore, DQMClient} = await loadDeps();
                    applyCors(req, res, config.corsOrigins);

                    if (method === 'OPTIONS') {
                        handlePreflight(req, res, config.corsOrigins);
                        return;
                    }

                    if (pathname === '/health' && method === 'GET') {
                        console.log(`[${new Date().toISOString()}] ${method} ${pathname}`);
                        sendJson(res, 200, {status: 'ok', timestamp: new Date().toISOString()});
                        return;
                    }

                    const requestLogPath = pathname;
                    console.log(`[${new Date().toISOString()}] ${method} ${requestLogPath}`);

                    if (pathname === '/auth/login' && method === 'POST') {
                        try {
                            const body = await parseBody(req, res);
                            if (!body) return;

                            const {apiKey, websiteId} = body as { apiKey?: string; websiteId?: string };
                            if (!apiKey || !websiteId) {
                                sendJson(res, 400, {error: true, message: 'Missing required fields: apiKey, websiteId'});
                                return;
                            }

                            if (!/^[\x00-\x7F]*$/.test(apiKey)) {
                                sendJson(res, 400, {error: true, message: 'API key contains non-ASCII characters'});
                                return;
                            }

                            const dqmClient = new DQMClient(apiKey, websiteId);
                            const isValid = await dqmClient.validateCredentials();
                            if (!isValid) {
                                console.warn('[Auth] Could not validate credentials during login, will validate on first API call');
                            }

                            const sessionToken = await sessionStore.create(apiKey, websiteId);
                            console.log(`[Auth] User logged in (websiteId: ${websiteId})`);
                            sendJson(res, 200, {sessionToken, websiteId});
                            return;
                        } catch (error: any) {
                            console.error('[Auth] Login error:', error?.message || error);
                            sendJson(res, 401, {error: true, message: error?.message || 'Authentication failed'});
                            return;
                        }
                    }

                    if (pathname === '/auth/token' && method === 'POST') {
                        sendJson(res, 501, {
                            error: true,
                            message: 'Session-based authentication not available. Please use /auth/login with API key and website ID.',
                        });
                        return;
                    }

                    if (pathname === '/auth/oauth2/callback' && method === 'POST') {
                        sendJson(res, 501, {
                            error: true,
                            message: 'OAuth2 authentication not available. Please use /auth/login with API key and website ID.',
                        });
                        return;
                    }

                    if (pathname === '/auth/token/validate' && method === 'POST') {
                        const body = await parseBody(req, res);
                        if (!body) return;

                        const {sessionToken} = body as { sessionToken?: string };
                        if (!sessionToken) {
                            sendJson(res, 400, {valid: false, message: 'Missing sessionToken'});
                            return;
                        }

                        const session = await sessionStore.get(sessionToken);
                        if (!session) {
                            sendJson(res, 200, {valid: false, message: 'Session not found or expired'});
                            return;
                        }

                        if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
                            await sessionStore.delete(sessionToken);
                            sendJson(res, 200, {valid: false, message: 'Session expired'});
                            return;
                        }

                        sendJson(res, 200, {
                            valid: true,
                            websiteId: session.websiteId,
                            expiresAt: session.expiresAt,
                        });
                        return;
                    }

                    const authenticate = async () => {
                        const authHeader = req.headers.authorization;
                        if (!authHeader || !authHeader.startsWith('Bearer ')) {
                            sendJson(res, 401, {error: true, message: 'Missing or invalid authorization header'});
                            return null;
                        }

                        const token = authHeader.replace('Bearer ', '');
                        const session = await sessionStore.get(token);
                        if (!session) {
                            console.error(`[Auth] Invalid or expired session token: ${token.substring(0, 16)}...`);
                            await sessionStore.count();
                            sendJson(res, 401, {error: true, message: 'Invalid or expired session token. Please log in again.'});
                            return null;
                        }

                        await sessionStore.extend(token);
                        return {session, token};
                    };

                    if (pathname === '/auth/logout' && method === 'POST') {
                        const auth = await authenticate();
                        if (!auth) return;
                        await sessionStore.delete(auth.token);
                        sendJson(res, 200, {success: true, message: 'Logged out successfully'});
                        return;
                    }

                    if (pathname === '/auth/session' && method === 'GET') {
                        const auth = await authenticate();
                        if (!auth) return;
                        sendJson(res, 200, {
                            session: {
                                websiteId: auth.session.websiteId,
                                createdAt: auth.session.createdAt,
                                expiresAt: auth.session.expiresAt,
                            },
                        });
                        return;
                    }

                    if (pathname === '/dqm/assets' && method === 'POST') {
                        const auth = await authenticate();
                        if (!auth) return;
                        const body = await parseBody(req, res);
                        if (!body) return;

                        const {html, url: pageUrl, websiteId} = body as { html?: string; url?: string; websiteId?: string };
                        if (!html) {
                            sendJson(res, 400, {error: true, message: 'Missing required field: html'});
                            return;
                        }

                        const dqmClient = new DQMClient(auth.session.apiKey, auth.session.websiteId);
                        const result = await dqmClient.createAsset({
                            html,
                            url: pageUrl,
                            websiteId: websiteId || auth.session.websiteId,
                        });
                        sendJson(res, 200, result);
                        return;
                    }

                    const statusMatch = pathname.match(/^\/dqm\/assets\/([^/]+)\/status$/);
                    if (statusMatch && method === 'GET') {
                        const auth = await authenticate();
                        if (!auth) return;
                        const assetId = statusMatch[1];
                        if (!assetId) {
                            sendJson(res, 400, {error: true, message: 'Missing required parameter: assetId'});
                            return;
                        }
                        const dqmClient = new DQMClient(auth.session.apiKey, auth.session.websiteId);
                        const result = await dqmClient.getAssetStatus(assetId);
                        sendJson(res, 200, result);
                        return;
                    }

                    const highlightAllMatch = pathname.match(/^\/dqm\/assets\/([^/]+)\/pagehighlight\/all$/);
                    if (highlightAllMatch && method === 'GET') {
                        const auth = await authenticate();
                        if (!auth) return;
                        const assetId = highlightAllMatch[1];
                        if (!assetId) {
                            sendJson(res, 400, {error: true, message: 'Missing required parameter: assetId'});
                            return;
                        }
                        const dqmClient = new DQMClient(auth.session.apiKey, auth.session.websiteId);
                        const html = await dqmClient.getPageHighlightAll(assetId);
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'text/html; charset=utf-8');
                        res.end(html);
                        return;
                    }

                    const highlightCheckpointMatch = pathname.match(/^\/dqm\/assets\/([^/]+)\/pagehighlight\/([^/]+)$/);
                    if (highlightCheckpointMatch && method === 'GET') {
                        const auth = await authenticate();
                        if (!auth) return;
                        const assetId = highlightCheckpointMatch[1];
                        const checkpointId = highlightCheckpointMatch[2];
                        if (!assetId || !checkpointId) {
                            sendJson(res, 400, {error: true, message: 'Missing required parameters: assetId, checkpointId'});
                            return;
                        }
                        const highlightSource = url.searchParams.get('highlightSource') === 'true';
                        const dqmClient = new DQMClient(auth.session.apiKey, auth.session.websiteId);
                        const html = await dqmClient.getPageHighlightCheckpoint(assetId, checkpointId, highlightSource);
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'text/html; charset=utf-8');
                        res.end(html);
                        return;
                    }

                    if (method === 'GET' && (pathname === '/auth' || pathname === '/auth/' || pathname === '/auth/login' || pathname === '/auth/callback')) {
                        applyAuthUiHeaders(res);
                        if (sendFile(req, res, authUiIndexPath)) {
                            return;
                        }
                        sendText(res, 404, 'Auth UI not built. Run `npm run build:auth-ui`.');
                        return;
                    }

                    if (method === 'GET' || method === 'HEAD') {
                        if (pathname.startsWith('/auth/')) {
                            const filePath = resolve(authUiPath, `.${pathname.replace(/^\/auth/, '')}`);
                            if (filePath.startsWith(authUiPath)) {
                                applyAuthUiHeaders(res);
                                if (sendFile(req, res, filePath)) {
                                    return;
                                }
                            }
                            sendText(res, 404, 'Auth UI asset not found.');
                            return;
                        }

                        if (pathname.startsWith('/assets/')) {
                            const filePath = resolve(authUiPath, `.${pathname}`);
                            if (filePath.startsWith(authUiPath)) {
                                applyAuthUiHeaders(res);
                                if (sendFile(req, res, filePath)) {
                                    return;
                                }
                            }
                            sendText(res, 404, 'Auth UI asset not found.');
                            return;
                        }
                    }

                    sendJson(res, 404, {error: true, message: 'Not found'});
                })().catch((error: any) => {
                    console.error('[Vite Backend] Unhandled error:', error?.message || error);
                    sendJson(res, 500, {error: true, message: error?.message || 'Internal server error'});
                });
            });
        },
    };
};
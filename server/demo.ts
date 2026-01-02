import {createServer, type ViteDevServer} from 'vite';
import app from '.';

createServer({
    server: {
        middlewareMode: true
    },
    base: "/",
}).then((viteDevServer: ViteDevServer) => {
    app.use(viteDevServer.middlewares);
});

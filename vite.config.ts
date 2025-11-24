import {defineConfig} from 'vite'
import react from "@vitejs/plugin-react-swc"
import {resolve} from 'path'
import dts from 'vite-plugin-dts'
import MagicString from 'magic-string'

// Plugin to remove console.log in production builds
const removeConsolePlugin = () => {
    return {
        name: 'remove-console',
        transform(code: string, id: string) {
            if (id.includes('node_modules')) return null;

            // Use magic-string for proper source map generation
            const s = new MagicString(code);
            let hasReplaced = false;

            // Remove console.log statements, keep console.warn and console.error
            // Use a more robust approach to handle nested parentheses
            const regex = /console\.log\s*\(/g;
            let match;

            while ((match = regex.exec(code)) !== null) {
                // Find the matching closing parenthesis
                let depth = 1;
                let pos = match.index + match[0].length;
                let inString = false;
                let stringChar = '';
                let escaped = false;

                while (pos < code.length && depth > 0) {
                    const char = code[pos];

                    if (escaped) {
                        escaped = false;
                    } else if (char === '\\') {
                        escaped = true;
                    } else if (!inString && (char === '"' || char === "'" || char === '`')) {
                        inString = true;
                        stringChar = char;
                    } else if (inString && char === stringChar) {
                        inString = false;
                    } else if (!inString) {
                        if (char === '(') depth++;
                        else if (char === ')') depth--;
                    }

                    pos++;
                }

                // Check if there's a semicolon right after
                if (pos < code.length && code[pos] === ';') {
                    pos++;
                }

                s.overwrite(match.index, pos, '/* removed console.log */');
                hasReplaced = true;
            }

            if (!hasReplaced) return null;

            return {
                code: s.toString(),
                map: s.generateMap({ hires: true })
            };
        }
    };
};

export default defineConfig(({mode}) => {
    const isLibrary = mode === 'library';

    if (isLibrary) {
        // Library build configuration
        return {
            plugins: [
                react({
                    jsxImportSource: '@emotion/react',
                }),
                dts({
                    tsconfigPath: './tsconfig.lib.json',
                }),
                removeConsolePlugin()
            ],
            build: {
                lib: {
                    entry: resolve(__dirname, 'src/index.ts'),
                    name: 'CrownpeakDQM',
                    formats: ['es', 'cjs'],
                    fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`
                },
                rollupOptions: {
                    external: [
                        'react',
                        'react-dom',
                        'react/jsx-runtime',
                        '@mui/material',
                        '@mui/icons-material',
                        '@mui/system',
                        '@emotion/react',
                        '@emotion/styled'
                    ],
                    output: {
                        globals: {
                            react: 'React',
                            'react-dom': 'ReactDOM',
                            '@mui/material': 'MaterialUI',
                            '@mui/icons-material': 'MaterialUIIcons'
                        }
                    }
                },
                sourcemap: true,
                emptyOutDir: true
            },
            optimizeDeps: {
                include: [
                    '@emotion/react',
                    '@emotion/styled',
                    '@mui/material',
                    '@mui/icons-material'
                ]
            }
        };
    }

    // Development mode configuration
    return {
        plugins: [
            react({
                jsxImportSource: '@emotion/react',
            })
        ],
        optimizeDeps: {
            include: [
                '@emotion/react',
                '@emotion/styled',
                '@mui/material',
                '@mui/icons-material'
            ]
        },
        resolve: {
            alias: {
                '@emotion/react': '@emotion/react',
                '@emotion/styled': '@emotion/styled'
            }
        },
        server: {
            port: 5173,
            proxy: {
                // Proxy API requests to backend server
                '/auth': {
                    target: 'http://localhost:3001',
                    changeOrigin: true,
                },
                '/dqm': {
                    target: 'http://localhost:3001',
                    changeOrigin: true,
                },
                '/assets': {
                    target: 'http://localhost:3001',
                    changeOrigin: true,
                }
            }
        }
    };
})

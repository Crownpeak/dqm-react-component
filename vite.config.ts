import {defineConfig} from 'vite'
import react from "@vitejs/plugin-react-swc"
import {resolve} from 'path'
import dts from 'vite-plugin-dts'

// Plugin to remove console.log in production builds
const removeConsolePlugin = () => {
    return {
        name: 'remove-console',
        transform(code: string, id: string) {
            if (id.includes('node_modules')) return null;
            // Remove console.log statements, keep console.warn and console.error
            // Match complete statements including multiline
            return code.replace(/console\.log\s*\([^;]*\);?/g, '/* removed console.log */');
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

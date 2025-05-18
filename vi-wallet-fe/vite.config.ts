import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
    server: {
        https: true,
        hmr: { protocol: 'wss', host: 'localhost', port: 5173 }
    }
});

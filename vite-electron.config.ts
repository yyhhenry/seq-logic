import { defineConfig } from 'vite';
import path from 'path';
export default defineConfig({
    build: {
        outDir: 'dist/electron',
        target: 'esnext',
        commonjsOptions: {},
        lib: {
            entry: ['src/electron/main.ts', 'src/electron/preload.ts'],
            formats: ['cjs'],
            name: 'electron',
        },
        rollupOptions: {
            external: name => {
                if (path.isAbsolute(name)) {
                    return false;
                }
                if (name.startsWith('.')) {
                    return false;
                }
                return true;
            },
        },
    },
});

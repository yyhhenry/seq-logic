import { app, dialog, ipcMain } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { isDevelopmentMode } from './isDevelopmentMode';
const mainRemote = {
    app: {
        getPath: app.getPath.bind(app),
    },
    dialog,
};
export function handleMainRemote() {
    const names = [] as string[];
    function handle(main: Record<string, any>, keys: string[]) {
        for (const [key, value] of Object.entries(main)) {
            if (typeof value === 'object') {
                handle(value, [...keys, key]);
            } else {
                const name = [...keys, key].join('.');
                names.push(name);
                ipcMain.handle(name, (_, ...args: any[]) =>
                    (value as any)(...args)
                );
            }
        }
    }
    handle(mainRemote, []);
    if (isDevelopmentMode) {
        const flatModule = `
import type { app, dialog } from 'electron';
export const remoteList = [
${names.map(name => `    '${name}',`).join('\n')}
];
export type MainRemote = {
${names.map(name => `    '${name}': typeof ${name};`).join('\n')}
};
`.trimStart();
        fs.writeFile(
            path.resolve(process.cwd(), 'src/electron/mainRemote.ts'),
            flatModule
        );
    }
}

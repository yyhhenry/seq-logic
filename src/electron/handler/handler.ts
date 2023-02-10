import type { WholeHandler } from '../bridge';
import { app, dialog } from 'electron';
import nodeFS from 'fs/promises';
import path from 'path';
import { v4 as uuidV4 } from 'uuid';
import { isDevelopmentMode } from '../isDevelopmentMode';
const content: WholeHandler['content'] = {
    title: async () => `Electron Builder Pnpm Template - ${process.platform}`,
    uuid: () => uuidV4(),
};
const fs: WholeHandler['fs'] = {
    getPath: (_event, name) => {
        if (name === 'extra') {
            return path.join(
                isDevelopmentMode
                    ? process.cwd()
                    : path.dirname(app.getPath('exe')),
                'extraFiles'
            );
        }
        return app.getPath(name);
    },
    openFile: async (_event, option) => {
        const result = await dialog.showOpenDialog(option);
        return result.canceled ? undefined : result.filePaths;
    },
    readFile: async (_event, pathname) => {
        return await nodeFS.readFile(pathname, { encoding: 'utf-8' });
    },
    readDir: async (_event, pathname) => {
        return await nodeFS.readdir(pathname);
    },
    getFileSize: async (_event, pathname) => {
        return (await nodeFS.stat(pathname)).size;
    },
    joinPath: async (_event, ...args) => {
        return path.join(...args);
    },
    resolvePath: async (_event, ...args) => {
        return path.resolve(...args);
    },
};
export const wholeHandler: WholeHandler = {
    content,
    fs,
};

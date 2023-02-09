import type { WholeHandler } from '../bridge';
import { app, dialog } from 'electron';
import nodeFS from 'fs/promises';
const content: WholeHandler['content'] = {
    templateName: async () =>
        `Electron Builder Pnpm Template - ${process.platform}`,
};
const fs: WholeHandler['fs'] = {
    getPath: (_event, name) => {
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
};
export const wholeHandler: WholeHandler = {
    content,
    fs,
};

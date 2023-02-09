import type { WholeHandler } from '../bridge';
import { app, dialog as electronDialog } from 'electron';
const templateName: WholeHandler['templateName'] = {
    templateName: async () =>
        `Electron Builder Pnpm Template - ${process.platform}`,
};
const dialog: WholeHandler['dialog'] = {
    getPath: (_event, name) => {
        return app.getPath(name);
    },
    openFile: async (_event, option) => {
        const result = await electronDialog.showOpenDialog(option);
        return result.filePaths;
    },
};
export const wholeHandler: WholeHandler = {
    templateName,
    dialog,
};

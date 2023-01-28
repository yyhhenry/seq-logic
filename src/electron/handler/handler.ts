import type { WholeHandler } from '../bridge';
import fs from 'fs';
const templateName: WholeHandler['templateName'] = {
    templateName: async () =>
        'Electron Builder Pnpm Template - ' +
        JSON.stringify(__dirname) +
        ' with ' +
        JSON.stringify(await fs.promises.readdir(__dirname)),
};
export const wholeHandler: WholeHandler = {
    templateName,
};

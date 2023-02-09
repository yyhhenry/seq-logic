import type { WholeRemote } from '../electron/bridge';
const windowWithBridge = window as unknown as WholeRemote;
export const remote: WholeRemote = {
    templateName: windowWithBridge.templateName,
    fs: windowWithBridge.fs,
};

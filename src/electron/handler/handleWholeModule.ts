import { app, ipcMain } from 'electron';
import type { BridgeDef, WholeHandler } from '../bridge';
export const handleModule = async <T extends BridgeDef.BridgeBaseModule>(
    name: string,
    module: BridgeDef.BridgeHandlerModule<T>
) => {
    await app.whenReady();
    for (const [key, value] of Object.entries(module)) {
        ipcMain.handle(`${name}.${key}`, value);
    }
};
export const handleWholeModule = async (whole: WholeHandler) => {
    await app.whenReady();
    for (const [key, value] of Object.entries(whole)) {
        await handleModule(key, value);
    }
};

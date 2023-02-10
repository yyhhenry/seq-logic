import { contextBridge, ipcRenderer } from 'electron';
import type { WholeRemote } from './bridge';

type DefOf<T extends {} = {}> = {
    [Key in keyof T]: 0;
};
const invokerOf = <T extends keyof WholeRemote>(
    name: T,
    list: DefOf<WholeRemote[T]>
) => {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(list)) {
        result[key] = (...args: unknown[]) =>
            ipcRenderer.invoke(`${name}.${key}`, ...args);
    }
    return result as WholeRemote[T];
};
const content = invokerOf('content', {
    title: 0,
});
const fs = invokerOf('fs', {
    openFile: 0,
    getPath: 0,
    readFile: 0,
    readDir: 0,
    getFileSize: 0,
});
const remote: WholeRemote = { content, fs };
contextBridge.exposeInMainWorld('remote', remote);

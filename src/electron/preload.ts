import { contextBridge, ipcRenderer } from 'electron';
import { type MainRemote, remoteList } from './mainRemote';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { isDevelopmentMode } from './isDevelopmentMode';

type PromiseFunction<T> = T extends (...args: infer A) => infer R
    ? (...args: A) => Promise<R>
    : never;

type Main = {
    [K in keyof MainRemote]: PromiseFunction<MainRemote[K]>;
};
const main = Object.fromEntries(
    remoteList.map(
        name =>
            [name, (...args: any[]) => ipcRenderer.invoke(name, ...args)] as [
                string,
                any
            ]
    )
) as Main;

const remote = {
    fs,
    path,
    uuid,
    main,
    getExtraPath: async () => {
        return path.join(
            isDevelopmentMode
                ? process.cwd()
                : path.dirname(await main['app.getPath']('exe')),
            'extraFiles'
        );
    },
};
type Remote = typeof remote;
contextBridge.exposeInMainWorld('remote', remote);
export default Remote;

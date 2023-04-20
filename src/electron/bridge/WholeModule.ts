import type { BridgeDef } from './declaration';
import type { OpenDialogOptions, SaveDialogOptions } from 'electron';
export interface ContentBaseModule extends BridgeDef.BridgeBaseModule {
    title: () => string;
    uuid: () => string;
}
export interface FileSystemBaseModule extends BridgeDef.BridgeBaseModule {
    getPath: (
        name:
            | 'extra'
            | 'home'
            | 'appData'
            | 'userData'
            | 'sessionData'
            | 'temp'
            | 'exe'
            | 'module'
            | 'desktop'
            | 'documents'
            | 'downloads'
            | 'music'
            | 'pictures'
            | 'videos'
            | 'recent'
            | 'logs'
            | 'crashDumps'
    ) => string;
    readFile: (pathname: string) => string;
    readDir: (pathname: string) => string[];
    getFileSize: (pathname: string) => number;
    openFile: (option: OpenDialogOptions) => string[] | undefined;
    saveFile: (option: SaveDialogOptions) => string | undefined;
    joinPath: (...args: string[]) => string;
    resolvePath: (...args: string[]) => string;
}
export interface WholeBase extends BridgeDef.BridgeWholeBase {
    content: ContentBaseModule;
    fs: FileSystemBaseModule;
}
export type WholeHandler = BridgeDef.BridgeWholeHandler<WholeBase>;
export type WholeRemote = BridgeDef.BridgeWholeRemote<WholeBase>;

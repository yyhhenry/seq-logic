import type { BridgeDef } from './declaration';
import type { OpenDialogOptions, app } from 'electron';
export interface TemplateNameBaseModule extends BridgeDef.BridgeBaseModule {
    templateName: () => string;
}
export interface FileSystemBaseModule extends BridgeDef.BridgeBaseModule {
    getPath: typeof app.getPath;
    readFile: (pathname: string) => string;
    readDir: (pathname: string) => string[];
    getFileSize: (pathname: string) => number;
    openFile: (option: OpenDialogOptions) => string[] | undefined;
}
export interface WholeBase extends BridgeDef.BridgeWholeBase {
    templateName: TemplateNameBaseModule;
    fs: FileSystemBaseModule;
}
export type WholeHandler = BridgeDef.BridgeWholeHandler<WholeBase>;
export type WholeRemote = BridgeDef.BridgeWholeRemote<WholeBase>;

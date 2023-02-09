import type { IpcMainInvokeEvent } from 'electron';
export namespace BridgeDef {
    export type BridgeValue =
        | undefined
        | string
        | number
        | bigint
        | boolean
        | BridgeValue[]
        | { [Key in string]: BridgeValue };

    export type BridgeBaseFunction = (...args: any[]) => BridgeValue;
    export type BridgeHandler<T extends BridgeBaseFunction> = T extends (
        ...args: infer Args
    ) => infer Ret
        ? (event: IpcMainInvokeEvent, ...args: Args) => Ret | Promise<Ret>
        : never;
    export type BridgeRemote<T extends BridgeBaseFunction> = T extends (
        ...args: infer Args
    ) => infer Ret
        ? (...args: Args) => Promise<Ret>
        : never;

    export type BridgeBaseModule = {
        [Key in string]: BridgeBaseFunction;
    };
    export type BridgeHandlerModule<T extends BridgeBaseModule> = {
        [Key in keyof T]: BridgeHandler<T[Key]>;
    };
    export type BridgeRemoteModule<T extends BridgeBaseModule> = {
        [Key in keyof T]: BridgeRemote<T[Key]>;
    };

    export type BridgeWholeBase = {
        [Key in string]: BridgeBaseModule;
    };
    export type BridgeWholeHandler<T extends BridgeWholeBase> = {
        [Key in keyof T]: BridgeHandlerModule<T[Key]>;
    };
    export type BridgeWholeRemote<T extends BridgeWholeBase> = {
        [Key in keyof T]: BridgeRemoteModule<T[Key]>;
    };
}

import { BridgeDef } from '.';
export interface TemplateNameBaseModule extends BridgeDef.BridgeBaseModule {
    templateName: () => string;
}
export interface WholeBase extends BridgeDef.BridgeWholeBase {
    templateName: TemplateNameBaseModule;
}
export type WholeHandler = BridgeDef.BridgeWholeHandler<WholeBase>;
export type WholeRemote = BridgeDef.BridgeWholeRemote<WholeBase>;

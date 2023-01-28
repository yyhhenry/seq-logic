import { BridgeDef } from '.';
import { TemplateNameBaseModule } from './tempateNameModule';
export interface WholeBase extends BridgeDef.BridgeWholeBase {
    templateName: TemplateNameBaseModule;
}
export type WholeHandler = BridgeDef.BridgeWholeHandler<WholeBase>;
export type WholeRemote = BridgeDef.BridgeWholeRemote<WholeBase>;

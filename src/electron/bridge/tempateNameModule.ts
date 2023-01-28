import type { BridgeDef } from './declaration';
export interface TemplateNameBaseModule extends BridgeDef.BridgeBaseModule {
    templateName: () => string;
}

import type { WholeRemote } from '../electron/bridge';
export const remote = (window as unknown as { remote: WholeRemote }).remote;

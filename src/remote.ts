import type Remote from '../electron/preload';
const remote = (window as unknown as { remote: Remote }).remote;
export default remote;

import { fs, path } from '@tauri-apps/api';
import { getReadableFilename } from '../readable';
import { loadDiagramStorageFile } from '.';
export async function getUnitsFolder() {
    return await path.resolveResource('units');
}
export async function getUnits() {
    const folder = await getUnitsFolder();
    return await Promise.all(
        (
            await fs.readDir(folder)
        ).map(async file => await getReadableFilename(file.path))
    );
}
export function getPopularUnits() {
    return ['and', 'or', 'nand', 'd-latch', 'd-trigger'];
}
export async function getUnit(name: string) {
    const folder = await getUnitsFolder();
    return await loadDiagramStorageFile(
        await path.join(folder, `${name}.seq.json`)
    );
}

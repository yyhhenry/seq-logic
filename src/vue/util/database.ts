import {openDB, type DBSchema} from 'idb';

export interface FileRecord {
    pathname: string;
    title: string;
    updatedTime: number;
}

interface SequenceLogic extends DBSchema {
    'seq-logic': {
        key: 'files';
        value: FileRecord[];
    };
}

export const db = openDB<SequenceLogic>('seq-logic', 1, {
    upgrade(db) {
        db.createObjectStore('seq-logic');
    },
});

export const getFiles = async () => {
    const files = await (await db).get('seq-logic', 'files');
    return files || [];
};
export const updateFile = async (file: FileRecord) => {
    const files = await getFiles();
    const index = files.findIndex(f => f.pathname === file.pathname);
    if (index === -1) {
        files.push(file);
    } else {
        files[index] = file;
    }
    files.sort((a, b) => b.updatedTime - a.updatedTime);
    await (await db).put('seq-logic', files, 'files');
};

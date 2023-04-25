import { clone } from 'lodash';
import { v4 as uuid } from 'uuid';
import { MaybeObject, isObjectMaybe } from '../types';
import { isObjectOf } from '../types';
import remote from '@/remote';
interface Coordinate {
    x: number;
    y: number;
}
export const isCoordinate = <T extends Coordinate>(
    u: unknown
): u is Coordinate & MaybeObject<T> => {
    return (
        isObjectMaybe<Coordinate>(u) &&
        typeof u.x === 'number' &&
        typeof u.y === 'number'
    );
};
export interface Clock {
    offset: number;
    duration: number;
}
export const isClock = (u: unknown): u is Clock => {
    return (
        isObjectMaybe<Clock>(u) &&
        typeof u.offset === 'number' &&
        typeof u.duration === 'number'
    );
};
export interface Node extends Coordinate {
    powered: boolean;
    clock?: Clock;
}
export const isNode = (u: unknown): u is Node => {
    return (
        isCoordinate<Node>(u) &&
        typeof u.powered === 'boolean' &&
        (u.clock === undefined || isClock(u.clock))
    );
};
export interface Wire {
    start: string;
    end: string;
    not: boolean;
}
export const isWire = (u: unknown): u is Wire => {
    return (
        isObjectMaybe<Wire>(u) &&
        typeof u.start === 'string' &&
        typeof u.end === 'string' &&
        typeof u.not === 'boolean'
    );
};
export interface Text extends Coordinate {
    text: string;
    size: string;
}
export const isText = (u: unknown): u is Text => {
    return (
        isCoordinate<Text>(u) &&
        typeof u.text === 'string' &&
        typeof u.size === 'string'
    );
};
export interface Viewport extends Coordinate {
    scale: number;
}
export const isViewport = (u: unknown): u is Viewport => {
    return (
        isCoordinate<Viewport>(u) && typeof u.scale === 'number' && u.scale > 0
    );
};
export interface DiagramStorage {
    nodes: Record<string, Node>;
    wires: Record<string, Wire>;
    texts: Record<string, Text>;
    viewport: Viewport;
}
export const isDiagramStorage = (u: any): u is DiagramStorage => {
    return (
        isObjectMaybe<DiagramStorage>(u) &&
        isObjectOf(u.nodes, isNode) &&
        isObjectOf(u.wires, isWire) &&
        isObjectOf(u.texts, isText) &&
        isViewport(u.viewport)
    );
};
export interface Status {
    powered: boolean;
    active: boolean;
    nextTick?: number;
}
export interface BaseModification<T> {
    deleted?: T;
    inserted?: T;
}
export class History<T> {
    private items: Map<string, T>;
    private history: Map<string, BaseModification<T>>[];
    private current: number;
    constructor(items: Map<string, T>) {
        this.items = items;
        this.history = [];
        this.current = -1;
    }
    has(id: string) {
        return this.items.has(id);
    }
    get(id: string) {
        const origin = this.items.get(id);
        return clone(origin);
    }
    delete(id: string) {
        const cur = this.history[this.current];
        const origin = this.items.get(id);
        const item = cur.get(id);
        if (item) {
            item.inserted = undefined;
        } else {
            cur.set(id, { deleted: origin });
        }
        this.items.delete(id);
    }
    set(id: string, value: T) {
        const cur = this.history[this.current];
        const origin = this.items.get(id);
        const item = cur.get(id);
        const inserted = clone(value);
        if (item) {
            item.inserted = inserted;
        } else {
            cur.set(id, { inserted, deleted: origin });
        }
        this.items.set(id, inserted);
    }
    saveHistory() {
        while (this.current < this.history.length - 1) {
            this.history.pop();
        }
        this.current++;
        this.history.push(new Map<string, BaseModification<T>>());
    }
    /**
     *  Do not modify the items.
     */
    entries() {
        return this.items.entries();
    }
    keys() {
        return this.items.keys();
    }
    undo() {
        if (this.current < 0) {
            return false;
        }
        const cur = this.history[this.current--];
        for (const [id, value] of cur.entries()) {
            if (value.deleted) {
                this.items.set(id, value.deleted);
            } else {
                this.items.delete(id);
            }
        }
        return true;
    }
    redo() {
        if (this.current >= this.history.length - 1) {
            return false;
        }
        const cur = this.history[++this.current];
        for (const [id, value] of cur.entries()) {
            if (value.inserted) {
                this.items.set(id, value.inserted);
            } else {
                this.items.delete(id);
            }
        }
        return true;
    }
}
export const remarkId = (storage: DiagramStorage) => {
    const nodeIdMapping = new Map(
        [...Object.keys(storage.nodes)].map(
            id => [id, uuid()] satisfies [string, string]
        )
    );
    const nodes = Object.fromEntries(
        Object.entries(storage.nodes).map(
            ([id, node]) =>
                [nodeIdMapping.get(id)!, node] satisfies [string, Node]
        )
    );
    const wires = Object.fromEntries(
        Object.values(storage.wires).map(
            wire =>
                [
                    uuid(),
                    {
                        start: nodeIdMapping.get(wire.start)!,
                        end: nodeIdMapping.get(wire.end)!,
                        not: wire.not,
                    },
                ] satisfies [string, Wire]
        )
    );
    const texts = Object.fromEntries(
        Object.values(storage.texts).map(
            text => [uuid(), text] satisfies [string, Text]
        )
    );
    return clone({
        nodes,
        wires,
        texts,
        viewport: storage.viewport,
    } satisfies DiagramStorage);
};
/**
 * A diagram.
 *
 * When updating the coordinate of the nodes and texts, no need to re-parse the whole diagram. But you need to call saveHistory() after the update.
 * You should not update the existence of the nodes, wires and texts. You should call add and remove instead.
 * When updating the viewport, no need to call anything and there is no history.
 */
export class Diagram {
    nodes: History<Node>;
    wires: History<Wire>;
    texts: History<Text>;
    viewport: Viewport;

    private status: Map<string, Status>;
    private toggle: Map<number, Set<string>>;
    private current: number;
    private wireWithNode: Map<string, Set<string>>;
    private groupRoot: Map<string, string>;
    private updatePrec: Map<string, Set<string>>;
    private updateSucc: Map<string, Set<string>>;

    modified: boolean;

    constructor(storage: DiagramStorage) {
        storage = clone(storage);
        function recordToMap<T>(record: Record<string, T>) {
            return new History(new Map(Object.entries(record)));
        }
        this.nodes = recordToMap(storage.nodes);
        this.wires = recordToMap(storage.wires);
        this.texts = recordToMap(storage.texts);
        this.status = new Map(
            [...this.nodes.entries()].map(([id, { powered }]) => [
                id,
                { active: powered, powered },
            ])
        );
        this.toggle = new Map();
        this.current = 0;
        this.viewport = storage.viewport;
        this.wireWithNode = new Map();
        this.groupRoot = new Map();
        this.updatePrec = new Map();
        this.updateSucc = new Map();
        this.modified = false;
        this.parse();
    }
    private activateAll() {
        for (const [id, value] of this.groupRoot.entries()) {
            if (id == value) {
                this.activate(id);
            }
        }
    }
    private getGroupRoot(nodeId: string): string {
        const fa = this.groupRoot.get(nodeId)!;
        if (fa == nodeId) {
            return nodeId;
        }
        const result = this.getGroupRoot(fa);
        this.groupRoot.set(nodeId, result);
        return result;
    }
    /**
     * Parse the diagram and build the data structure.
     */
    private parse() {
        this.wireWithNode = new Map(
            [...this.nodes.entries()].map(([id]) => [id, new Set()])
        );
        for (const [id, wire] of this.wires.entries()) {
            this.wireWithNode.get(wire.start)!.add(id);
            this.wireWithNode.get(wire.end)!.add(id);
        }
        for (const [id, status] of this.status.entries()) {
            status.powered = this.nodes.get(id)!.powered;
        }
        this.groupRoot = new Map(
            [...this.nodes.entries()].map(([id]) => [id, id])
        );
        for (const [_id, wire] of this.wires.entries()) {
            if (wire.not) {
                continue;
            }
            const start = this.getGroupRoot(wire.start);
            const end = this.getGroupRoot(wire.end);
            if (start == end) {
                continue;
            }
            this.groupRoot.set(start, end);
            this.status.get(end)!.powered ||= this.status.get(start)!.powered;
        }
        for (const id of this.nodes.keys()) {
            this.getGroupRoot(id);
        }
        this.updatePrec = new Map(
            [...this.nodes.entries()].map(([id]) => [id, new Set()])
        );
        this.updateSucc = new Map(
            [...this.nodes.entries()].map(([id]) => [id, new Set()])
        );
        for (const [_id, wire] of this.wires.entries()) {
            if (!wire.not) {
                continue;
            }
            const start = this.getGroupRoot(wire.start);
            const end = this.getGroupRoot(wire.end);
            this.updatePrec.get(end)!.add(start);
            this.updateSucc.get(start)!.add(end);
        }
        this.activateAll();
    }
    /**
     * Get into the next tick.
     */
    nextTick() {
        const toggle = this.toggle.get(this.current);
        if (toggle !== undefined) {
            const succList = new Set<string>();
            for (const id of toggle) {
                const status = this.status.get(id)!;
                status.active = !status.active;
                status.nextTick = undefined;
                for (const succ of this.updateSucc.get(id)!) {
                    succList.add(succ);
                }
            }
            for (const succ of succList) {
                this.activate(succ);
            }
        }
        this.toggle.delete(this.current++);
    }
    private activate(nodeId: string) {
        const status = this.status.get(nodeId)!;
        let result = status.powered;
        for (const prec of this.updatePrec.get(nodeId)!) {
            result ||= !this.status.get(prec)!.active;
        }
        if (result == status.active) {
            if (status.nextTick !== undefined) {
                (this.toggle.get(status.nextTick) ?? new Map()).delete(nodeId);
                status.nextTick = undefined;
            }
        } else {
            if (status.nextTick === undefined) {
                const offset = Math.floor(Math.random() * 2) + 3;
                status.nextTick = this.current + offset;
                if (!this.toggle.has(status.nextTick)) {
                    this.toggle.set(status.nextTick, new Set());
                }
                this.toggle.get(status.nextTick)!.add(nodeId);
            }
        }
    }
    extract(nodeIds: Set<string>, textIds: Set<string>) {
        const wireIds = new Set(
            [...this.wires.entries()]
                .filter(([_id, wire]) => {
                    return nodeIds.has(wire.start) && nodeIds.has(wire.end);
                })
                .map(([id]) => id)
        );
        const nodes = Object.fromEntries(
            [...this.nodes.entries()].filter(([id]) => nodeIds.has(id))
        );
        const wires = Object.fromEntries(
            [...this.wires.entries()].filter(([id]) => wireIds.has(id))
        );
        const texts = Object.fromEntries(
            [...this.texts.entries()].filter(([id]) => textIds.has(id))
        );
        return {
            nodes,
            wires,
            texts,
            viewport: this.viewport,
        } satisfies DiagramStorage;
    }
    merge(storage: DiagramStorage) {
        // TODO
    }
    getNodeStatus(nodeId: string) {
        return this.status.get(this.getGroupRoot(nodeId)!)!;
    }
    /**
     * Save the history to handle undo and redo.
     */
    saveHistory(parse = true) {
        this.modified = true;
        this.nodes.saveHistory();
        this.wires.saveHistory();
        this.texts.saveHistory();
        if (parse) {
            this.parse();
        }
    }
    undo() {
        this.nodes.undo();
        this.wires.undo();
        this.texts.undo();
        this.parse();
    }
    redo() {
        this.nodes.redo();
        this.wires.redo();
        this.texts.redo();
        this.parse();
    }
    addNode(node: Node) {
        const id = uuid();
        this.nodes.set(id, node);
        return id;
    }
    addWire(wire: Wire) {
        const id = uuid();
        this.wires.set(id, wire);
        return id;
    }
    addText(text: Text) {
        const id = uuid();
        this.texts.set(id, text);
        return id;
    }
    removeNode(id: string) {
        this.saveHistory();
        if (this.nodes.has(id)) {
            this.nodes.delete(id);
            for (const wireId of this.wireWithNode.get(id)!) {
                this.wires.delete(wireId);
            }
        } else {
            throw new Error('node not found');
        }
        this.parse();
    }
    removeWire(id: string) {
        this.saveHistory();
        if (this.wires.has(id)) {
            this.wires.delete(id);
        } else {
            throw new Error('wire not found');
        }
        this.parse();
    }
    removeText(id: string) {
        this.saveHistory();
        if (this.texts.has(id)) {
            this.texts.delete(id);
        } else {
            throw new Error('text not found');
        }
    }
    toStorage(): DiagramStorage {
        return clone({
            nodes: Object.fromEntries(this.nodes.entries()),
            wires: Object.fromEntries(this.wires.entries()),
            texts: Object.fromEntries(this.texts.entries()),
            viewport: this.viewport,
        });
    }
    static async loadFile(pathname: string) {
        const content = await remote.fs.readFile(pathname, 'utf-8');
        const diagram = JSON.parse(content);
        if (isDiagramStorage(diagram)) {
            return new Diagram(diagram);
        } else {
            throw new Error('Invalid file');
        }
    }
    async saveFile(pathname: string) {
        const storage = this.toStorage();
        await remote.fs.writeFile(pathname, JSON.stringify(storage));
        this.modified = false;
    }
}

export const getBlankDiagramStorage = (): DiagramStorage => {
    return {
        nodes: {},
        wires: {},
        texts: {},
        viewport: {
            x: 0,
            y: 0,
            scale: 1,
        },
    };
};

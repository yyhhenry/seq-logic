import { cloneDeep } from 'lodash';
import { v4 as uuid } from 'uuid';
import { MaybeObject, isObjectMaybe } from '../types';
import { isObjectOf } from '../types';
import remote from '@/remote';
import { ElMessage } from 'element-plus';
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
    powered: boolean | Clock;
}
export const isNode = (u: unknown): u is Node => {
    return (
        isCoordinate<Node>(u) &&
        (typeof u.powered === 'boolean' || isClock(u.powered))
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
    scale: number;
}
export const isText = (u: unknown): u is Text => {
    return (
        isCoordinate<Text>(u) &&
        typeof u.text === 'string' &&
        typeof u.scale === 'number'
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
/**
 * 自动保存历史记录
 * 默认指针在最后一条记录，初始在0
 * 每次进行一次独立修改时commit()
 */
export class History<T> {
    private items: Map<string, T>;
    private history: Map<string, BaseModification<T>>[];
    /**
     * 指向当前记录
     * modifying: 指向正在修改的记录
     * committed: 指向可进行redo的第一条记录
     */
    private current: number;
    private status: 'modifying' | 'committed';
    constructor(items: Map<string, T>) {
        this.items = items;
        this.history = [];
        this.current = -1;
        this.commit();
        this.status = 'committed';
    }
    has(id: string) {
        return this.items.has(id);
    }
    /**
     * After modifying, you should set it back.
     */
    get(id: string) {
        const origin = this.items.get(id);
        return cloneDeep(origin);
    }
    entries() {
        return [...this.items.keys()].map(
            id => [id, _NNA(this.get(id))] satisfies [string, T]
        );
    }
    keys() {
        return this.items.keys();
    }
    /**
     * Start modifying.
     */
    private beforeModify() {
        if (this.status === 'committed') {
            while (this.history.length - 1 > this.current) {
                this.history.pop();
            }
            this.history[this.current] = new Map<string, BaseModification<T>>();
            this.status = 'modifying';
        }
    }
    delete(id: string) {
        this.beforeModify();
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
        this.beforeModify();
        const cur = this.history[this.current];
        const origin = this.items.get(id);
        const item = cur.get(id);
        const inserted = cloneDeep(value);
        if (item) {
            item.inserted = inserted;
        } else {
            cur.set(id, { inserted, deleted: origin });
        }
        this.items.set(id, inserted);
    }
    /**
     * End modifying.
     */
    commit() {
        this.beforeModify();
        this.history.push(new Map<string, BaseModification<T>>());
        this.current++;
        this.status = 'committed';
    }
    undo() {
        if (this.status === 'modifying') {
            throw new Error('Cannot undo while modifying.');
        }
        if (this.current <= 0) {
            return false;
        }
        this.current--;
        const cur = this.history[this.current];
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
        if (this.status === 'modifying') {
            throw new Error('Cannot redo while modifying.');
        }
        if (this.current >= this.history.length - 1) {
            return false;
        }
        const cur = this.history[this.current];
        for (const [id, value] of cur.entries()) {
            if (value.inserted) {
                this.items.set(id, value.inserted);
            } else {
                this.items.delete(id);
            }
        }
        this.current++;
        return true;
    }
}
const notNullAssertion = <T>(value: T | undefined | null): T => {
    if (value == null) {
        throw new Error('value is null');
    }
    return value;
};
const _NNA = notNullAssertion;
export const remarkId = (storage: DiagramStorage) => {
    const nodeIdMapping = new Map(
        [...Object.keys(storage.nodes)].map(
            id => [id, uuid()] satisfies [string, string]
        )
    );
    const nodes = Object.fromEntries(
        Object.entries(storage.nodes).map(
            ([id, node]) =>
                [_NNA(nodeIdMapping.get(id)), node] satisfies [string, Node]
        )
    );
    const wires = Object.fromEntries(
        Object.values(storage.wires).map(
            wire =>
                [
                    uuid(),
                    {
                        start: _NNA(nodeIdMapping.get(wire.start)),
                        end: _NNA(nodeIdMapping.get(wire.end)),
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
    return cloneDeep({
        nodes,
        wires,
        texts,
        viewport: storage.viewport,
    } satisfies DiagramStorage);
};
export function getPowered(powered: boolean | Clock): boolean {
    if (typeof powered === 'boolean') {
        return powered;
    } else {
        powered;
        const cur = Date.now() - powered.offset;
        const idx = Math.floor(cur / powered.duration);
        return idx % 2 === 0;
    }
}
/**
 * A diagram.
 *
 * 更新后调用commit()，如果不需要re-parse，就传入false。
 * You should not update the existence of the nodes, wires and texts. You should call add and remove instead.
 * When updating the viewport, no need to call anything and there is no history.
 *
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

    /**
     * 在Vue的响应式语法影响下，禁止在构造函数中添加未来可能会被监听的this属性，所有this属性必须由当前方法立即得到
     */
    constructor(storage: DiagramStorage) {
        storage = cloneDeep(storage);
        function recordToMap<T>(record: Record<string, T>) {
            return new History(new Map(Object.entries(record)));
        }
        this.nodes = recordToMap(storage.nodes);
        this.wires = recordToMap(storage.wires);
        this.texts = recordToMap(storage.texts);
        this.status = new Map(
            [...this.nodes.entries()].map(([id, { powered }]) => [
                id,
                getPowered(powered)
                    ? { active: true, powered: true }
                    : { active: false, powered: false },
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
        const fa = _NNA(this.groupRoot.get(nodeId));
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
            _NNA(this.wireWithNode.get(wire.start)).add(id);
            _NNA(this.wireWithNode.get(wire.end)).add(id);
        }
        for (const id of this.nodes.keys()) {
            if (this.status.get(id) == null) {
                this.status.set(id, { active: false, powered: false });
            }
        }
        const needToRemove = new Set<string>();
        for (const [id, status] of this.status.entries()) {
            const node = this.nodes.get(id);
            if (node == null) {
                needToRemove.add(id);
            } else {
                status.powered = getPowered(node.powered);
            }
        }
        for (const id of needToRemove) {
            const nextTick = this.status.get(id)?.nextTick;
            if (nextTick != null) {
                this.toggle.get(nextTick)?.delete(id);
            }
            this.status.delete(id);
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
            _NNA(this.status.get(end)).powered ||= _NNA(
                this.status.get(start)
            ).powered;
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
            _NNA(this.updatePrec.get(end)).add(start);
            _NNA(this.updateSucc.get(start)).add(end);
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
                const status = _NNA(this.status.get(id));
                status.active = !status.active;
                status.nextTick = undefined;
                for (const succ of _NNA(this.updateSucc.get(id))) {
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
        const status = _NNA(this.status.get(nodeId));
        let result = status.powered;
        for (const prec of _NNA(this.updatePrec.get(nodeId))) {
            result ||= !_NNA(this.status.get(prec)).active;
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
                _NNA(this.toggle.get(status.nextTick)).add(nodeId);
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
        return cloneDeep({
            nodes,
            wires,
            texts,
            viewport: this.viewport,
        }) satisfies DiagramStorage as DiagramStorage;
    }
    merge(storage: DiagramStorage) {
        const [dx, dy] = [
            this.viewport.x - storage.viewport.x - (Math.random() * 10 + 10),
            this.viewport.y - storage.viewport.y - (Math.random() * 10 + 10),
        ];
        storage = remarkId(storage);
        [...Object.values(storage.nodes)].forEach(node => {
            node.x -= dx;
            node.y -= dy;
        });
        [...Object.values(storage.texts)].forEach(text => {
            text.x -= dx;
            text.y -= dy;
        });
        for (const [id, node] of Object.entries(storage.nodes)) {
            this.nodes.set(id, node);
        }
        for (const [id, wire] of Object.entries(storage.wires)) {
            this.wires.set(id, wire);
        }
        for (const [id, text] of Object.entries(storage.texts)) {
            this.texts.set(id, text);
        }
        this.commit();
        return {
            nodes: new Set(Object.keys(storage.nodes)),
            wires: new Set(Object.keys(storage.wires)),
            texts: new Set(Object.keys(storage.texts)),
        };
    }
    getNodeStatus(nodeId: string) {
        return _NNA(this.status.get(_NNA(this.getGroupRoot(nodeId))));
    }
    /**
     * Save the history to handle undo and redo.
     */
    commit() {
        this.modified = true;
        this.nodes.commit();
        this.wires.commit();
        this.texts.commit();
        this.parse();
    }
    undo() {
        const valid =
            this.nodes.undo() && this.wires.undo() && this.texts.undo();
        if (valid) {
            this.modified = true;
            this.parse();
        } else {
            ElMessage.error('Cannot undo anymore');
        }
    }
    redo() {
        const valid =
            this.nodes.redo() && this.wires.redo() && this.texts.redo();
        if (valid) {
            this.modified = true;
            this.parse();
        } else {
            ElMessage.error('Cannot redo anymore');
        }
    }
    addNode(node: Node) {
        const id = uuid();
        this.nodes.set(id, node);
        return id;
    }
    addWire(wire: Wire) {
        const id = uuid();
        if (wire.start === wire.end) {
            return;
        }
        for (const wireId of this.wireWithNode.get(wire.start) ?? []) {
            const w = _NNA(this.wires.get(wireId));
            if (w.start === wire.end || w.end === wire.end) {
                return;
            }
        }
        this.wires.set(id, wire);
        return id;
    }
    addText(text: Text) {
        const id = uuid();
        this.texts.set(id, text);
        return id;
    }
    removeNode(id: string) {
        if (this.nodes.has(id)) {
            this.nodes.delete(id);
            for (const wireId of _NNA(this.wireWithNode.get(id))) {
                this.wires.delete(wireId);
            }
        } else {
            throw new Error('node not found');
        }
    }
    removeWire(id: string) {
        if (this.wires.has(id)) {
            this.wires.delete(id);
        } else {
            throw new Error('wire not found');
        }
    }
    removeText(id: string) {
        if (this.texts.has(id)) {
            this.texts.delete(id);
        } else {
            throw new Error('text not found');
        }
    }
    toStorage(): DiagramStorage {
        return cloneDeep({
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
    fetchClock() {
        this.parse();
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

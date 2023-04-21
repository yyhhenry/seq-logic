import { clone } from 'lodash';
import { v4 as uuid } from 'uuid';
import { MaybeObject, isObjectMaybe } from '../types';
import { isObjectOf } from '../types';
interface BasePoint {
    x: number;
    y: number;
}
export const isBasePoint = <T extends BasePoint>(
    u: unknown
): u is BasePoint & MaybeObject<T> => {
    return (
        isObjectMaybe<BasePoint>(u) &&
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
export interface Point extends BasePoint {
    powered: boolean;
    clock?: Clock;
}
export const isPoint = (u: unknown): u is Point => {
    return (
        isBasePoint<Point>(u) &&
        typeof u.powered === 'boolean' &&
        (u.clock === undefined || isClock(u.clock))
    );
};
export interface Line {
    start: string;
    end: string;
    not: boolean;
}
export const isLine = (u: unknown): u is Line => {
    return (
        isObjectMaybe<Line>(u) &&
        typeof u.start === 'string' &&
        typeof u.end === 'string' &&
        typeof u.not === 'boolean'
    );
};
export interface Text extends BasePoint {
    text: string;
    size: string;
}
export const isText = (u: unknown): u is Text => {
    return (
        isBasePoint<Text>(u) &&
        typeof u.text === 'string' &&
        typeof u.size === 'string'
    );
};
export interface Viewport extends BasePoint {
    scale: number;
}
export const isViewport = (u: unknown): u is Viewport => {
    return (
        isBasePoint<Viewport>(u) && typeof u.scale === 'number' && u.scale > 0
    );
};
export interface DiagramStorage {
    points: Record<string, Point>;
    lines: Record<string, Line>;
    texts: Record<string, Text>;
    viewport: Viewport;
}
export const isDiagramStorage = (u: any): u is DiagramStorage => {
    return (
        isObjectMaybe<DiagramStorage>(u) &&
        isObjectOf(u.points, isPoint) &&
        isObjectOf(u.lines, isLine) &&
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
/**
 * A diagram.
 *
 * When updating the position of the points and texts, no need to re-parse the whole diagram. But you need to call saveHistory() after the update.
 * You should not update the existence of the points, lines and texts. You should call add and remove instead.
 * When updating the viewport, no need to call anything and there is no history.
 */
export class Diagram {
    points: History<Point>;
    lines: History<Line>;
    texts: History<Text>;
    viewport: Viewport;

    private status: Map<string, Status>;
    private toggle: Map<number, Set<string>>;
    private current: number;
    private lineWithPoint: Map<string, Set<string>>;
    private groupRoot: Map<string, string>;
    private updatePrec: Map<string, Set<string>>;
    private updateSucc: Map<string, Set<string>>;

    constructor(storage: DiagramStorage) {
        storage = clone(storage);
        function recordToMap<T>(record: Record<string, T>) {
            return new History(new Map(Object.entries(record)));
        }
        this.points = recordToMap(storage.points);
        this.lines = recordToMap(storage.lines);
        this.texts = recordToMap(storage.texts);
        this.status = new Map(
            [...this.points.entries()].map(([id, { powered }]) => [
                id,
                { active: powered, powered },
            ])
        );
        this.toggle = new Map();
        this.current = 0;
        this.viewport = storage.viewport;
        this.lineWithPoint = new Map();
        this.groupRoot = new Map();
        this.updatePrec = new Map();
        this.updateSucc = new Map();
        this.parse();
    }
    private activateAll() {
        for (const [id, value] of this.groupRoot.entries()) {
            if (id == value) {
                this.activate(id);
            }
        }
    }
    private getGroupRoot(pointId: string): string {
        const fa = this.groupRoot.get(pointId)!;
        if (fa == pointId) {
            return pointId;
        }
        const result = this.getGroupRoot(fa);
        this.groupRoot.set(pointId, result);
        return result;
    }
    /**
     * Parse the diagram and build the data structure.
     */
    private parse() {
        this.lineWithPoint = new Map(
            [...this.points.entries()].map(([id]) => [id, new Set()])
        );
        for (const [id, line] of this.lines.entries()) {
            this.lineWithPoint.get(line.start)!.add(id);
            this.lineWithPoint.get(line.end)!.add(id);
        }
        for (const [id, status] of this.status.entries()) {
            status.powered = this.points.get(id)!.powered;
        }
        this.groupRoot = new Map(
            [...this.points.entries()].map(([id]) => [id, id])
        );
        for (const [_id, line] of this.lines.entries()) {
            if (line.not) {
                continue;
            }
            const start = this.getGroupRoot(line.start);
            const end = this.getGroupRoot(line.end);
            if (start == end) {
                continue;
            }
            this.groupRoot.set(start, end);
            this.status.get(end)!.powered ||= this.status.get(start)!.powered;
        }
        for (const id of this.points.keys()) {
            this.getGroupRoot(id);
        }
        this.updatePrec = new Map(
            [...this.points.entries()].map(([id]) => [id, new Set()])
        );
        this.updateSucc = new Map(
            [...this.points.entries()].map(([id]) => [id, new Set()])
        );
        for (const [_id, line] of this.lines.entries()) {
            if (!line.not) {
                continue;
            }
            const start = this.getGroupRoot(line.start);
            const end = this.getGroupRoot(line.end);
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
            console.log(this.current, [...toggle]);
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
    private activate(pointId: string) {
        const status = this.status.get(pointId)!;
        let result = status.powered;
        for (const prec of this.updatePrec.get(pointId)!) {
            result ||= !this.status.get(prec)!.active;
        }
        if (result == status.active) {
            if (status.nextTick !== undefined) {
                (this.toggle.get(status.nextTick) ?? new Map()).delete(pointId);
                status.nextTick = undefined;
            }
        } else {
            if (status.nextTick === undefined) {
                const offset = Math.floor(Math.random() * 2) + 3;
                status.nextTick = this.current + offset;
                if (!this.toggle.has(status.nextTick)) {
                    this.toggle.set(status.nextTick, new Set());
                }
                this.toggle.get(status.nextTick)!.add(pointId);
            }
        }
    }
    getStatus(pointId: string) {
        return this.status.get(this.getGroupRoot(pointId)!)!;
    }
    /**
     * Save the history to handle undo and redo.
     */
    saveHistory() {
        this.points.saveHistory();
        this.lines.saveHistory();
        this.texts.saveHistory();
    }
    undo() {
        this.points.undo();
        this.lines.undo();
        this.texts.undo();
        this.parse();
    }
    redo() {
        this.points.redo();
        this.lines.redo();
        this.texts.redo();
        this.parse();
    }
    addPoint(point: Point) {
        this.saveHistory();
        const id = uuid();
        this.points.set(id, point);
        this.parse();
    }
    addLine(line: Line) {
        this.saveHistory();
        const id = uuid();
        this.lines.set(id, line);
        this.parse();
    }
    addText(text: Text) {
        this.saveHistory();
        const id = uuid();
        this.texts.set(id, text);
    }
    removePoint(id: string) {
        this.saveHistory();
        if (this.points.has(id)) {
            this.points.delete(id);
            for (const lineId of this.lineWithPoint.get(id)!) {
                this.lines.delete(lineId);
            }
        } else {
            throw new Error('point not found');
        }
        this.parse();
    }
    removeLine(id: string) {
        this.saveHistory();
        if (this.lines.has(id)) {
            this.lines.delete(id);
        } else {
            throw new Error('line not found');
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
            points: Object.fromEntries(this.points.entries()),
            lines: Object.fromEntries(this.lines.entries()),
            texts: Object.fromEntries(this.texts.entries()),
            viewport: this.viewport,
        });
    }
}

export const getBlankDiagramStorage = (): DiagramStorage => {
    return {
        points: {},
        lines: {},
        texts: {},
        viewport: {
            x: 0,
            y: 0,
            scale: 1,
        },
    };
};

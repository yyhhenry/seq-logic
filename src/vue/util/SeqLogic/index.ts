import { getDiffieHellman } from 'crypto';
import chain from 'lodash/chain';
interface BasePoint {
    x: number;
    y: number;
}
export interface Clock {
    offset: number;
    duration: number;
}
export interface Point extends BasePoint {
    powered: boolean;
    clock?: Clock;
}
export interface Line {
    start: string;
    end: string;
    not: boolean;
}
export interface Text extends BasePoint {
    text: string;
}
export interface Viewport extends BasePoint {
    scale: number;
}
export interface DiagramStorage {
    points: Record<string, Point>;
    lines: Record<string, Line>;
    texts: Record<string, Text>;
    viewport: Viewport;
}
export interface Status {
    active: boolean;
    nextTick?: number;
}
export interface BaseModification<T> {
    deleted?: T;
    inserted?: T;
}
export class History<T> {
    items: Map<string, T>;
    history: Map<string, BaseModification<T>>[];
    current: number;
    constructor(items: Map<string, T>) {
        this.items = items;
        this.history = [];
        this.current = -1;
    }
    get(id: string) {
        const origin = this.items.get(id);
        return chain(origin).clone().value();
    }
    private put(id: string, value: T) {
        const cur = this.history[this.current];
        const origin = this.items.get(id);
        const item = cur.get(id);
        const inserted = chain(value).clone().value();
        if (item) {
            item.inserted = inserted;
        } else {
            cur.set(id, { inserted, deleted: origin });
        }
        this.items.set(id, inserted);
    }
    modify(f: (put: (id: string, value: T) => void) => void) {
        while (this.current < this.history.length - 1) {
            this.history.pop();
        }
        this.current++;
        this.history.push(new Map<string, BaseModification<T>>());
        f((...args) => this.put(...args));
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
export class Diagram {
    points: History<Point>;
    lines: History<Line>;
    texts: History<Text>;
    status: Map<string, Status>;
    toggle: Map<number, Set<string>>;
    current: number;
    viewport: Viewport;

    lineWithPoint: Map<string, Set<string>>;
    groupRoot: Map<string, string>;
    updatePrec: Map<string, Set<string>>;
    updateSucc: Map<string, Set<string>>;

    constructor(storage: DiagramStorage) {
        function recordToMap<T>(record: Record<string, T>) {
            return new History(new Map(Object.entries(record)));
        }
        this.points = recordToMap(storage.points);
        this.lines = recordToMap(storage.lines);
        this.texts = recordToMap(storage.texts);
        this.status = new Map(
            [...this.points.entries()].map(([id, { powered }]) => [
                id,
                { active: powered, nextTick: undefined },
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
    parse() {
        this.lineWithPoint = new Map(
            [...this.points.entries()].map(([id]) => [id, new Set()])
        );
        for (const [id, line] of this.lines.entries()) {
            this.lineWithPoint.get(line.start)!.add(id);
            this.lineWithPoint.get(line.end)!.add(id);
        }
        this.groupRoot = new Map(
            [...this.points.entries()].map(([id]) => [id, id])
        );
        const getFather = (u: string): string => {
            const fa = this.groupRoot.get(u)!;
            if (fa == u) {
                return u;
            }
            const result = getFather(fa);
            this.groupRoot.set(u, result);
            return result;
        };
        for (const [_id, line] of this.lines.entries()) {
            if (line.not) {
                continue;
            }
            const start = getFather(line.start);
            const end = getFather(line.end);
            if (start == end) {
                continue;
            }
            this.groupRoot.set(start, end);
        }
        for (const id of this.points.keys()) {
            getFather(id);
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
            const start = getFather(line.start);
            const end = getFather(line.end);
            this.updatePrec.get(end)!.add(start);
            this.updateSucc.get(start)!.add(end);
        }
    }
    resolveToggle() {
        const toggle = this.toggle.get(this.current);
        if (toggle !== undefined) {
            const succList = new Set<string>();
            for (const id of toggle) {
                const status = this.status.get(id)!;
                status.active = !status.active;
                for (const succ of this.updateSucc.get(id)!) {
                    succList.add(succ);
                }
            }
            for (const succ of succList) {
                this.activate(succ);
            }
        }
    }
    activate(pointId: string) {
        const point = this.points.get(pointId)!;
        const status = this.status.get(pointId)!;
        let result = point.powered;
        for (const prec of this.updatePrec.get(pointId)!) {
            result ||= !this.status.get(prec)!.active;
        }
        if (result == status.active) {
            if (status.nextTick !== undefined) {
                (this.toggle.get(status.nextTick) ?? new Map()).delete(pointId);
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
    // TODO undo/redo
    toStorage(): DiagramStorage {
        return chain({
            points: Object.fromEntries(this.points.entries()),
            lines: Object.fromEntries(this.lines.entries()),
            texts: Object.fromEntries(this.texts.entries()),
            viewport: this.viewport,
        })
            .clone()
            .value();
    }
}

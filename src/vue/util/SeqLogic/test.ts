/**
 * 请勿添加到生产环境中，仅供测试使用
 */
import { Diagram, type DiagramStorage } from './';
const storage: DiagramStorage = {
    points: {
        '0': { x: 0, y: 0, powered: false },
        '1': { x: 0, y: 0, powered: false },
        '2': { x: 0, y: 0, powered: false },
    },
    lines: {
        'line:0': { start: '0', end: '1', not: true },
        'line:1': { start: '1', end: '2', not: false },
        'line:2': { start: '2', end: '0', not: true },
    },
    texts: {},
    viewport: {
        x: 0,
        y: 0,
        scale: 1,
    },
};
const diagram = (() => {
    const diagram = new Diagram(storage);
    const print = (s: Map<string, unknown>) => {
        console.log(
            JSON.stringify(
                [...s.entries()].filter(([d]) => diagram.groupRoot.get(d) == d)
            )
        );
    };
    print(diagram.status);
    diagram.resolveToggles();
    print(diagram.status);
    for (let i = 0; i < 30; i++) {
        diagram.resolveToggles();
    }
    print(diagram.status);
    return diagram;
})();
export { diagram };

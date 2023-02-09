/**
 * 返回人类可读的文件大小
 * @param size 以Byte为单位的文件大小
 * @example
 * console.log([10, 1000, 1024, 1e5, 1e7, 1e13, 1e17].map(v => readableSize(v)));
 */
export const readableSize = (size: number) => {
    const rate = 1024;
    const names = ['B', 'KiB', 'MiB', 'GiB'];
    for (const [index, name] of names.entries()) {
        const sizeNumber = size / rate ** index;
        if (sizeNumber < rate) {
            return `${index === 0 ? sizeNumber : sizeNumber.toFixed(1)}${name}`;
        }
    }
    const last = names.length - 1;
    return `${(size / rate ** last).toPrecision(4)}${names[last]}`;
};

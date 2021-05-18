function add(name: string, ...args: number[]): string {
    const total = args.reduce((prev, item) => prev + item, 0);

    return `${name}: ${total}`;
}

console.log(add('Dennis', 1, 2, 3, 4, 5));
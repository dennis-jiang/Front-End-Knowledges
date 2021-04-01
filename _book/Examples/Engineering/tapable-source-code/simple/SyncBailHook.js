class SyncBailHook {
    constructor(args = []) {
        this._args = args;       
        this.taps = [];          
    }

    tap(name, fn) {
        this.taps.push(fn);
    }

    // 其他代码跟SyncHook是一样的，就是call的实现不一样
    // 需要检测每个返回值，如果不为undefined就终止执行
    call(...args) {
        const tapsLength = this.taps.length;
        for(let i = 0; i < tapsLength; i++) {
            const fn = this.taps[i];
            const res = fn(...args);

            if( res !== undefined) break;
        }
    }
}

module.exports = {
    SyncBailHook
}
class SyncHook {
    constructor(args = []) {
        this._args = args;       // 接收的参数存下来
        this.taps = [];          // 一个存回调的数组
    }

    // tap实例方法用来注册回调
    tap(name, fn) {
        // 逻辑很简单，直接保存下传入的回调参数就行
        this.taps.push(fn);
    }

    // call实例方法用来触发事件，执行所有回调
    call(...args) {
        // 逻辑也很简单，将注册的回调一个一个拿出来执行就行
        const tapsLength = this.taps.length;
        for(let i = 0; i < tapsLength; i++) {
            const fn = this.taps[i];
            fn(...args);
        }
    }
}

module.exports = {
    SyncHook
}
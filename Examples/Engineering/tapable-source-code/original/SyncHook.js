const Hook = require('./Hook');
const HookCodeFactory = require("./HookCodeFactory");

// SyncHookCodeFactory继承HookCodeFactory并实现content函数
class SyncHookCodeFactory extends HookCodeFactory {
    content() {
        return this.callTapsSeries();
    }
}

// 使用SyncHookCodeFactory来创建factory
const factory = new SyncHookCodeFactory();

const COMPILE = function (options) {
    factory.setup(this, options);
    return factory.create(options);
};

function SyncHook(args = []) {
    // 先手动继承Hook
    const hook = new Hook(args);
    hook.constructor = SyncHook;

    // 然后实现自己的compile函数
    // compile的作用应该是创建一个call函数并返回
    // hook.compile = function(options) {
    //     // 这里call函数的实现跟前面实现是一样的
    //     const { taps } = options;
    //     const call = function(...args) {
    //         const tapsLength = taps.length;
    //         for(let i = 0; i < tapsLength; i++) {
    //             const fn = this.taps[i];
    //             fn(...args);
    //         }
    //     }

    //     return call;
    // };

    // 使用HookCodeFactory来创建最终的call函数
    hook.compile = COMPILE;

    return hook;
}

SyncHook.prototype = null;

module.exports = { SyncHook };

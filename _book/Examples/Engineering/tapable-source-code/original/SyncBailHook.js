const Hook = require('./Hook');
const HookCodeFactory = require("./HookCodeFactory");

// SyncBailHookCodeFactory继承HookCodeFactory并实现content函数
// content里面传入定制的onResult函数
class SyncBailHookCodeFactory extends HookCodeFactory {
    content() {
        return this.callTapsSeries({
            onResult: (i, result, next) =>
                `if(${result} !== undefined) {\nreturn ${result};\n} else {\n${next()}}\n`,
        });
    }
}

// 使用SyncHookCodeFactory来创建factory
const factory = new SyncBailHookCodeFactory();

const COMPILE = function (options) {
    factory.setup(this, options);
    return factory.create(options);
};


function SyncBailHook(args = []) {
    // 基本结构跟SyncHook都是一样的
    const hook = new Hook(args);
    hook.constructor = SyncBailHook;


    // 只是compile的实现是Bail版的
    // hook.compile = function (options) {
    //     const { taps } = options;
    //     const call = function (...args) {
    //         const tapsLength = taps.length;
    //         for (let i = 0; i < tapsLength; i++) {
    //             const fn = this.taps[i];
    //             const res = fn(...args);

    //             if (res !== undefined) return res;
    //         }
    //     }

    //     return call;
    // };

    // 使用HookCodeFactory来创建最终的call函数
    hook.compile = COMPILE;

    return hook;
}

SyncBailHook.prototype = null;

module.exports = { SyncBailHook };
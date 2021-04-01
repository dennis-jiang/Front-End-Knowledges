const CALL_DELEGATE = function(...args) {
	this.call = this._createCall("sync");
	return this.call(...args);
};

// Hook是SyncHook和SyncBailHook的基类
// 大体结构是一样的，不一样的地方是call
// call不同的子类是不一样的
// tapable的Hook基类提供了一个抽象接口compile来动态生成call方法
class Hook {
    constructor(args = []) {
        this._args = args;       
        this.taps = [];          

        // 基类的call初始化为CALL_DELEGATE
        // 为什么这里需要这样一个代理，等我们后面子类实现了再一起讲
        this.call = CALL_DELEGATE;
    }

    // 一个抽象接口compile
    // 由子类实现，基类compile不能直接调用
    compile(options) {
		throw new Error("Abstract: should be overridden");
	}

    tap(name, fn) {
        this.taps.push(fn);
    }

    // _createCall调用子类实现的compile来生成call方法
    _createCall() {
		return this.compile({
			taps: this.taps,
			args: this._args,
		});
	}
}

module.exports = Hook;
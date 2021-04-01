class HookCodeFactory {
    constructor() {
        // 构造函数定义两个变量
        this.options = undefined;
        this._args = undefined;
    }

    // init函数初始化变量
    init(options) {
        this.options = options;
        this._args = options.args.slice();
    }

    // deinit重置变量
    deinit() {
        this.options = undefined;
        this._args = undefined;
    }

    // args用来将传入的数组args转换为New Function接收的逗号分隔的形式
    // ['arg1', 'args'] --->  'arg1, arg2'
    args() {
        return this._args.join(", ");
    }

    // setup其实就是给生成代码的_x赋值
    setup(instance, options) {
        instance._x = options.taps.map(t => t);
    }

    // create创建最终的call函数
    create(options) {
        this.init(options);
        let fn;

        // 拼装代码头部
        const header = `
            "use strict";
            var _x = this._x;
        `;

        // 用传进来的参数和函数体创建一个函数出来
        fn = new Function(this.args(),
            header +
            this.content());         // 注意这里的content函数并没有在基类HookCodeFactory实现

        this.deinit();  // 重置变量

        return fn;
    }

    // 拼装函数体
    callTapsSeries(options) {
        const { taps } = this.options;
        let code = '';
        let i = 0;

        const onResult = options && options.onResult;
        
        // 写一个next函数来开启有onResult回调的函数体生成
        // next和onResult相互递归调用来生成最终的函数体
        const next = () => {
            if(i >= taps.length) return '';

            const result = `_result${i}`;
            const code = `
                var _fn${i} = _x[${i}];
                var ${result} = _fn${i}(${this.args()});
                ${onResult(i++, result, next)}
            `;

            return code;
        }

        // 支持onResult参数
        if(onResult) {
            code = next();
        } else {
            for(; i< taps.length; i++) {
                code += `
                    var _fn${i} = _x[${i}];
                    _fn${i}(${this.args()});
                `
            }
        }


        // for (let i = 0; i < taps.length; i++) {
        //     code += `
        //         var _fn${i} = _x[${i}];
        //         _fn${i}(${this.args()});
        //     `
        // }

        return code;
    }
}

module.exports = HookCodeFactory;
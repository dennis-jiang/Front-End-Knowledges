const { resolve } = require('path');
// const send = require('koa-send');
const send = require('./koaSend');

module.exports = serve;   // 导出的是serve方法

// serve接受两个参数
// 第一个参数是路径地址
// 第二个是配置选项
function serve(root, opts) {
    // 这行代码如果效果就是
    // 如果没传opts，opts就是空对象{}
    // 同时将它的原型置为null
    opts = Object.assign(Object.create(null), opts);

    // 将root解析为一个合法路径，并放到opts上去
    // 因为koa-send接收的路径是在opts上
    opts.root = resolve(root);

    // 这个是用来兼容文件夹的，如果请求路径是一个文件夹，默认去取index
    // 如果用户没有配置index，默认index就是index.html
    if (opts.index !== false) opts.index = opts.index || 'index.html';

    // 如果defer为false，就用之前的逻辑，最后调用next
    if (!opts.defer) {
        // 整个serve方法的返回值是一个koa中间件
        // 符合koa中间件的范式： (ctx, next) => {}
        return async function serve(ctx, next) {
            let done = false;    // 这个变量标记文件是否成功返回

            // 只有HEAD和GET请求才响应
            if (ctx.method === 'HEAD' || ctx.method === 'GET') {
                try {
                    // 调用koa-send发送文件
                    // 如果发送成功，koa-send会返回路径，赋值给done
                    // done转换为bool值就是true
                    done = await send(ctx, ctx.path, opts);
                } catch (err) {
                    // 如果不是404，可能是一些400，500这种非预期的错误，将它抛出去
                    if (err.status !== 404) {
                        throw err
                    }
                }
            }

            // 通过done来检测文件是否发送成功
            // 如果没成功，就让后续中间件继续处理他
            // 如果成功了，本次请求就到此为止了
            if (!done) {
                await next()
            }
        }
    }

    // 如果defer为true，先调用next，然后执行自己的逻辑
    return async function serve(ctx, next) {
        // 先调用next,执行后面的中间件
        await next();

        if (ctx.method !== 'HEAD' && ctx.method !== 'GET') return

        // 如果ctx.body有值了，或者status不是404，说明请求已经被其他中间件处理过了，就直接返回了
        if (ctx.body != null || ctx.status !== 404) return // eslint-disable-line

        // koa-static自己的逻辑还是一样的，都是调用koa-send
        try {
            await send(ctx, ctx.path, opts)
        } catch (err) {
            if (err.status !== 404) {
                throw err
            }
        }
    }
}


const fs = require('fs')
const createError = require('http-errors')
const fsPromises = fs.promises;
const { stat } = fsPromises;

const {
    normalize,
    extname,
    resolve,
    parse,
    sep
} = require('path')
const resolvePath = require('resolve-path')

// 导出send方法
module.exports = send;

// send方法的实现
async function send(ctx, path, opts = {}) {
    // 先解析配置项
    const root = opts.root ? normalize(resolve(opts.root)) : '';  // 这里的root就是我们配置的静态文件目录，比如public
    const index = opts.index;    // 请求文件夹时，会去读取这个index文件
    const maxage = opts.maxage || opts.maxAge || 0;     // 就是http缓存控制Cache-Control的那个maxage
    const immutable = opts.immutable || false;   // 也是Cache-Control缓存控制的
    const format = opts.format !== false;   // format默认是true，用来支持/directory这种不带/的文件夹请求

    const trailingSlash = path[path.length - 1] === '/';    // 看看path结尾是不是/
    path = path.substr(parse(path).root.length)             // 去掉path开头的/

    path = decode(path);      // 其实就是decodeURIComponent， decode辅助方法在后面
    if (path === -1) return ctx.throw(400, 'failed to decode');

    // 如果请求以/结尾，肯定是一个文件夹，将path改为文件夹下面的默认文件
    if (index && trailingSlash) path += index;

    // resolvePath可以将一个根路径和请求的相对路径合并成一个绝对路径
    // 并且防止一些常见的攻击，比如GET /../file.js
    // GitHub地址：https://github.com/pillarjs/resolve-path
    path = resolvePath(root, path)

    // 用fs.stat获取文件的基本信息，顺便检测下文件存在不
    let stats;
    try {
        stats = await stat(path)

        // 如果是文件夹，并且format为true，拼上index文件
        if (stats.isDirectory()) {
            if (format && index) {
                path += `/${index}`
                stats = await stat(path)
            } else {
                return
            }
        }
    } catch (err) {
        // 错误处理，如果是文件不存在，返回404，否则返回500
        const notfound = ['ENOENT', 'ENAMETOOLONG', 'ENOTDIR']
        if (notfound.includes(err.code)) {
            // createError来自http-errors库，可以快速创建HTTP错误对象
            // github地址：https://github.com/jshttp/http-errors
            throw createError(404, err)
        }
        err.status = 500
        throw err
    }

    // 设置Content-Length的header
    ctx.set('Content-Length', stats.size)

    // 设置缓存控制header
    if (!ctx.response.get('Last-Modified')) ctx.set('Last-Modified', stats.mtime.toUTCString())
    if (!ctx.response.get('Cache-Control')) {
        const directives = [`max-age=${(maxage / 1000 | 0)}`]
        if (immutable) {
            directives.push('immutable')
        }
        ctx.set('Cache-Control', directives.join(','))
    }

    // 设置返回类型和返回内容
    if (!ctx.type) ctx.type = extname(path)
    ctx.body = fs.createReadStream(path)

    return path
}

function decode(path) {
    try {
        return decodeURIComponent(path)
    } catch (err) {
        return -1
    }
}
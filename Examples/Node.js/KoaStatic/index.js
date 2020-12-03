const Koa = require('koa');
// const serve = require('koa-static');
const serve = require('./myKoaStatic');

const app = new Koa();

// 主要就是这行代码
app.use(serve('public'));

app.listen(3001, () => {
    console.log('listening on port 3001');
});
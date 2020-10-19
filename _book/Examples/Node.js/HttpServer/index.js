const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');

const port = 3000;

const server = http.createServer((req, res) => {
  // 获取url的各个部分
  // url.parse可以将req.url解析成一个对象
  // 里面包含有pathname和querystring等
  const urlObject = url.parse(req.url);
  const { pathname } = urlObject;

  // api开头的是API请求
  if (pathname.startsWith('/api')) {
    // 再判断路由
    if (pathname === '/api/users') {
      // 获取HTTP动词
      const method = req.method;
      if (method === 'GET') {
        // 写一个假数据
        const resData = [
          {
            id: 1,
            name: '小明',
            age: 18
          },
          {
            id: 2,
            name: '小红',
            age: 19
          }
        ];
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(resData));
        return;
      } else if (method === 'POST') {
        // 注意数据传过来可能有多个chunk
        // 我们需要拼接这些chunk
        let postData = '';
        req.on('data', chunk => {
          postData = postData + chunk;
        })

        req.on('end', () => {
          // 数据传完后往db.txt插入内容
          fs.appendFile(path.join(__dirname, 'db.txt'), postData, () => {
            res.end(postData);  // 数据写完后将数据再次返回
          });
        })
      }
    }
  } else {
    // 使用path模块获取文件后缀名
    const extName = path.extname(pathname);

    if (extName === '.jpg') {
      // 使用fs模块读取文件
      fs.readFile(path.join(__dirname, pathname), (err, data) => {
        res.setHeader('Content-Type', 'image/jpeg');
        res.write(data);
        res.end();
      })
    }
  }
});

server.listen(port, () => {
  console.log(`Server is running on http://127.0.0.1:${port}/`);
});
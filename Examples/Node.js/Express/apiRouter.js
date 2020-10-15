const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router();

router.get('/users', (req, res) => {
  console.log('get users');
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
});

router.post('/users', (req, res) => {
  // 使用原生API
  // let postData = '';
  // req.on('data', chunk => {
  //   postData = postData + chunk;
  // });

  // req.on('end', () => {
  //   // 数据传完后往db.txt插入内容
  //   fs.appendFile(path.join(__dirname, 'db.txt'), postData, () => {
  //     res.end(postData);  // 数据写完后将数据再次返回
  //   });
  // });

  // 使用express.json()中间件后可以通过req.body拿到数据
  fs.appendFile(path.join(__dirname, 'db.txt'), JSON.stringify(req.body), () => {
    res.json(req.body);  // 数据写完后将数据再次返回
  });
});

module.exports = router

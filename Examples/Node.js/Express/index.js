const path = require("path");
// const express = require("express");
const express = require("./myExpress/express");
const fs = require("fs");
const url = require("url");

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  const urlObject = url.parse(req.url);
  const { pathname } = urlObject;

  console.log(`request path: ${pathname}`);

  next();
});

app.get("/api/users", (req, res) => {
  const resData = [
    {
      id: 1,
      name: "小明",
      age: 18,
    },
    {
      id: 2,
      name: "小红",
      age: 19,
    },
  ];
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(resData));
});

app.post("/api/users", (req, res) => {
  let postData = "";
  req.on("data", (chunk) => {
    postData = postData + chunk;
  });

  req.on("end", () => {
    // 数据传完后往db.txt插入内容
    fs.appendFile(path.join(__dirname, "db.txt"), postData, () => {
      res.end(postData); // 数据写完后将数据再次返回
    });
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}/`);
});

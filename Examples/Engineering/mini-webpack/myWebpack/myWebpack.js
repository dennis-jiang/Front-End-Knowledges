const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");
const generate = require("@babel/generator").default;

const config = require("../webpack.config"); // 引入配置文件

function parseFile(file) {
  // 读取入口文件
  const fileContent = fs.readFileSync(file, "utf-8");

  // 使用babel parser解析AST
  const ast = parser.parse(fileContent, { sourceType: "module" });

  let importFilePath = "";
  let importVarName = "";
  let importCovertVarName = "";

  // 使用babel traverse来遍历ast上的节点
  traverse(ast, {
    ImportDeclaration(p) {
      // 获取被import的文件
      const importFile = p.node.source.value;

      // import进来的变量名字
      importVarName = p.node.specifiers[0].local.name;

      // 获取文件路径
      importFilePath = path.join(path.dirname(file), importFile);
      importFilePath = `./${importFilePath}.js`;

      // 替换后的变量名字
      importCovertVarName = `__${path.basename(
        importFile
      )}__WEBPACK_IMPORTED_MODULE_0__`;

      // 构建一个目标变量定义的AST节点
      const variableDeclaration = t.variableDeclaration("var", [
        t.variableDeclarator(
          t.identifier(importCovertVarName),
          t.callExpression(t.identifier("__webpack_require__"), [
            t.stringLiteral(importFilePath),
          ])
        ),
      ]);

      // 将当前节点替换为变量定义节点
      p.replaceWith(variableDeclaration);
    },
    CallExpression(p) {
      // 如果调用的是import进来的函数
      if (p.node.callee.name === importVarName) {
        // 就将它替换为转换后的函数名字
        p.node.callee.name = `${importCovertVarName}.default`;
      }
    },
  });

  const newCode = generate(ast).code;

  console.log(newCode);

  return {
    file,
    dependcies: [importFilePath],
    code: newCode,
  };
}

parseFile(config.entry);

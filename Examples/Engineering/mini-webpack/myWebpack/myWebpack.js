const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const t = require("@babel/types");
const generate = require("@babel/generator").default;
const ejs = require("ejs");

const config = require("../webpack.config"); // 引入配置文件

const EXPORT_DEFAULT_FUN = `
__webpack_require__.d(__webpack_exports__, {
   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
});\n
`;

const ESMODULE_TAG_FUN = `
__webpack_require__.r(__webpack_exports__);\n
`;

const FUN_WRAPPER = `
((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {
    __TO_REPLACE_FUN_CONTENT__
})
`;

// 解析单个文件
function parseFile(file) {
  // 读取入口文件
  const fileContent = fs.readFileSync(file, "utf-8");

  // 使用babel parser解析AST
  const ast = parser.parse(fileContent, { sourceType: "module" });

  let importFilePath = "";
  let importVarName = "";
  let importCovertVarName = "";
  let hasExport = false;

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
    Identifier(p) {
      // 如果调用的是import进来的变量
      if (p.node.name === importVarName) {
        // 就将它替换为转换后的变量名字
        p.node.name = `${importCovertVarName}.default`;
      }
    },
    ExportDefaultDeclaration(p) {
      hasExport = true; // 先标记是否有export

      // 跟前面import类似的，创建一个变量定义节点
      const variableDeclaration = t.variableDeclaration("const", [
        t.variableDeclarator(
          t.identifier("__WEBPACK_DEFAULT_EXPORT__"),
          t.identifier(p.node.declaration.name)
        ),
      ]);

      // 将当前节点替换为变量定义节点
      p.replaceWith(variableDeclaration);
    },
  });

  let newCode = generate(ast).code;

  if (hasExport) {
    newCode = `${EXPORT_DEFAULT_FUN} ${newCode}`;
  }

  // 下面添加模块标记代码
  newCode = `${ESMODULE_TAG_FUN} ${newCode}`;

  // 下面添加代码外层的函数壳
  newCode = FUN_WRAPPER.replace("__TO_REPLACE_FUN_CONTENT__", newCode);

  return {
    file,
    dependencies: [importFilePath],
    code: newCode,
  };
}

function parseFiles(entryFile) {
  const entryRes = parseFile(entryFile); // 解析入口文件
  const results = [entryRes]; // 将解析结果放入一个数组

  // 循环结果数组，将它的依赖全部拿出来解析
  for (const res of results) {
    const dependencies = res.dependencies;
    dependencies.map((dependency) => {
      if (dependency) {
        const ast = parseFile(dependency);
        results.push(ast);
      }
    });
  }

  return results;
}

function generateCode(allAst, entry) {
  const __webpack_modules__ = allAst.map((item) => {
    const module = {};
    module[item.file] = Function(item.code);

    return module;
  });

  const temlateFile = fs.readFileSync(
    path.join(__dirname, "./template.js"),
    "utf-8"
  );

  //   const codes = ejs.render(temlateFile, {
  //     __TO_REPLACE_WEBPACK_MODULES__: allAst,
  //     __TO_REPLACE_WEBPACK_ENTRY__: entry,
  //   });

  const codes = temlateFile
    .replace(
      "__TO_REPLACE_WEBPACK_MODULES__",
      JSON.stringify(__webpack_modules__)
    )
    .replace("__TO_REPLACE_WEBPACK_ENTRY__", entry);

  return codes;
}

const allAst = parseFiles(config.entry);
const codes = generateCode(allAst, config.entry);

console.log(codes);

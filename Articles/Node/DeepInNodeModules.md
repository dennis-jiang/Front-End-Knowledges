模块是Node.js里面一个很基本也很重要的概念，各种原生类库是通过模块提供的，第三方库也是通过模块进行管理和引用的。本文会从基本的模块原理出发，到最后我们会利用这个原理，自己实现一个简单的模块加载机制，即自己实现一个`require`。

**本文完整代码已上传GitHub：[https://github.com/dennis-jiang/Front-End-Knowledges/blob/master/Examples/Node.js/Module/MyModule/index.js](https://github.com/dennis-jiang/Front-End-Knowledges/blob/master/Examples/Node.js/Module/MyModule/index.js)**

## 简单例子

老规矩，讲原理前我们先来一个简单的例子，从这个例子入手一步一步深入原理。Node.js里面如果要导出某个内容，需要使用`module.exports`，使用`module.exports`几乎可以导出任意类型的JS对象，包括字符串，函数，对象，数组等等。我们先来建一个`a.js`导出一个最简单的`hello world`:

```javascript
// a.js 
module.exports = "hello world";
```

然后再来一个`b.js`导出一个函数：

```javascript
// b.js
function add(a, b) {
  return a + b;
}

module.exports = add;
```

然后在`index.js`里面使用他们，即`require`他们，`require`函数返回的结果就是对应文件`module.exports`的值：

```javascript
// index.js
const a = require('./a.js');
const add = require('./b.js');

console.log(a);      // "hello world"
console.log(add(1, 2));    // b导出的是一个加法函数，可以直接使用，这行结果是3
```

### require会先运行目标文件

当我们`require`某个模块时，并不是只拿他的`module.exports`，而是会从头开始运行这个文件，`module.exports = XXX`其实也只是其中一行代码，我们后面会讲到，这行代码的效果其实就是修改模块里面的`exports`属性。比如我们再来一个`c.js`：

```javascript
// c.js
let c = 1;

c = c + 1;

module.exports = c;

c = 6;
```

在`c.js`里面我们导出了一个`c`，这个`c`经过了几步计算，当运行到`module.exports = c;`这行时`c`的值为`2`，所以我们`require`的`c.js`的值就是`2`，后面将`c`的值改为了`6`并不影响前面的这行代码:

```javascript
const c = require('./c.js');

console.log(c);  // c的值是2
```

前面`c.js`的变量`c`是一个基本数据类型，所以后面的`c = 6;`不影响前面的`module.exports`，那他如果是一个引用类型呢？我们直接来试试吧：

```javascript
// d.js
let d = {
  num: 1
};

d.num++;

module.exports = d;

d.num = 6;
```

然后在`index.js`里面`require`他：

```javascript
const d = require('./d.js');

console.log(d);     // { num: 6 }
```

我们发现在`module.exports`后面给`d.num`赋值仍然生效了，因为`d`是一个对象，是一个引用类型，我们可以通过这个引用来修改他的值。其实对于引用类型来说，不仅仅在`module.exports`后面可以修改他的值，在模块外面也可以修改，比如`index.js`里面就可以直接改：

```javascript
const d = require('./d.js');

d.num = 7;
console.log(d);     // { num: 7 }
```

## `require`和`module.exports`不是黑魔法

我们通过前面的例子可以看出来，`require`和`module.exports`干的事情并不复杂，我们先假设有一个全局对象`{}`，初始情况下是空的，当你`require`某个文件时，就将这个文件拿出来执行，如果这个文件里面存在`module.exports`，当运行到这行代码时将`module.exports`的值加入这个对象，键为对应的文件名，最终这个对象就长这样：

```javascript
{
  "a.js": "hello world",
  "b.js": function add(){},
  "c.js": 2,
  "d.js": { num: 2 }
}
```

当你再次`require`某个文件时，如果这个对象里面有对应的值，就直接返回给你，如果没有就重复前面的步骤，执行目标文件，然后将它的`module.exports`加入这个全局对象，并返回给调用者。这个全局对象其实就是我们经常听说的缓存。**所以`require`和`module.exports`并没有什么黑魔法，就只是运行并获取目标文件的值，然后加入缓存，用的时候拿出来用就行。**再看看这个对象，因为`d.js`是一个引用类型，所以你在任何地方获取了这个引用都可以更改他的值，如果不希望自己模块的值被更改，需要自己写模块时进行处理，比如使用`Object.freeze()`，`Object.defineProperty()`之类的方法。

## 模块类型和加载顺序

这一节的内容都是一些概念，比较枯燥，但是也是我们需要了解的。

### 模块类型

Node.js的模块有好几种类型，前面我们使用的其实都是`文件模块`，总结下来，主要有这两种类型：

> 1. **内置模块**：就是Node.js原生提供的功能，比如`fs`，`http`等等，这些模块在Node.js进程起来时就加载了。
> 2. **文件模块**：我们前面写的几个模块，还有第三方模块，即`node_modules`下面的模块都是文件模块。

### 加载顺序

加载顺序是指当我们`require(X)`时，应该按照什么顺序去哪里找`X`，在官方文档上有[详细伪代码](https://nodejs.org/dist/latest-v12.x/docs/api/modules.html#modules_all_together)，总结下来大概是这么个顺序：

> 1. 优先加载内置模块，即使有同名文件，也会优先使用内置模块。
> 2. 不是内置模块，先去缓存找。
> 3. 缓存没有就去找对应路径的文件。
> 4. 不存在对应的文件，就将这个路径作为文件夹加载。
> 5. 对应的文件和文件夹都找不到就去`node_modules`下面找。
> 6. 还找不到就报错了。

### 加载文件夹

前面提到找不到文件就找文件夹，但是不可能将整个文件夹都加载进来，加载文件夹的时候也是有一个加载顺序的：

> 1. 先看看这个文件夹下面有没有`package.json`，如果有就找里面的`main`字段，`main`字段有值就加载对应的文件。所以如果大家在看一些第三方库源码时找不到入口就看看他`package.json`里面的`main`字段吧，比如`jquery`的`main`字段就是这样：`"main": "dist/jquery.js"`。
> 2. 如果没有`package.json`或者`package.json`里面没有`main`就找`index`文件。
> 3. 如果这两步都找不到就报错了。

### 支持的文件类型

`require`主要支持三种文件类型：

> 1. **.js**：`.js`文件是我们最常用的文件类型，加载的时候会先运行整个JS文件，然后将前面说的`module.exports`作为`require`的返回值。
> 2. **.json**：`.json`文件是一个普通的文本文件，直接用`JSON.parse`将其转化为对象返回就行。
> 3. **.node**：`.node`文件是C++编译后的二进制文件，纯前端一般很少接触这个类型。

## 手写`require`

前面其实我们已经将原理讲的七七八八了，下面来到我们的重头戏，自己实现一个`require`。实现`require`其实就是实现整个Node.js的模块加载机制，我们再来理一下需要解决的问题：

> 1. 通过传入的路径名找到对应的文件。
> 2. 执行找到的文件，同时要注入`module`和`require`这些方法和属性，以便模块文件使用。
> 3. 返回模块的`module.exports`

本文的手写代码全部参照Node.js官方源码，函数名和变量名尽量保持一致，其实就是精简版的源码，大家可以对照着看，写到具体方法时我也会贴上对应的源码地址。总体的代码都在这个文件里面：[https://github.com/nodejs/node/blob/c6b96895cc74bc6bd658b4c6d5ea152d6e686d20/lib/internal/modules/cjs/loader.js](https://github.com/nodejs/node/blob/c6b96895cc74bc6bd658b4c6d5ea152d6e686d20/lib/internal/modules/cjs/loader.js)

### Module类

Node.js模块加载的功能全部在`Module`类里面，整个代码使用面向对象的思想，[如果你对JS的面向对象还不是很熟悉可以先看看这篇文章](https://juejin.im/post/6844904069887164423)。[`Module`类的构造函数](https://github.com/nodejs/node/blob/c6b96895cc74bc6bd658b4c6d5ea152d6e686d20/lib/internal/modules/cjs/loader.js#L168)也不复杂，主要是一些值的初始化，为了跟官方`Module`名字区分开，我们自己的类命名为`MyModule`：

```javascript
function MyModule(id = '') {
  this.id = id;       // 这个id其实就是我们require的路径
  this.path = path.dirname(id);     // path是Node.js内置模块，用它来获取传入参数对应的文件夹路径
  this.exports = {};        // 导出的东西放这里，初始化为空对象
  this.filename = null;     // 模块对应的文件名
  this.loaded = false;      // loaded用来标识当前模块是否已经加载
}
```

### require方法

我们一直用的`require`其实是`Module`类的一个实例方法，内容很简单，先做一些参数检查，然后调用`Module._load`方法，源码看这里：[https://github.com/nodejs/node/blob/c6b96895cc74bc6bd658b4c6d5ea152d6e686d20/lib/internal/modules/cjs/loader.js#L970](https://github.com/nodejs/node/blob/c6b96895cc74bc6bd658b4c6d5ea152d6e686d20/lib/internal/modules/cjs/loader.js#L970)。精简版的代码如下：

```javascript
MyModule.prototype.require = function (id) {
  return Module._load(id);
}
```

### MyModule._load

`MyModule._load`是一个静态方法，这才是`require`方法的真正主体，他干的事情其实是：

> 1. 先检查请求的模块在缓存中是否已经存在了，如果存在了直接返回缓存模块的`exports`。
> 2. 如果不在缓存中，就`new`一个`Module`实例，用这个实例加载对应的模块，并返回模块的`exports`。

我们自己来实现下这两个需求，缓存直接放在`Module._cache`这个静态变量上，这个变量官方初始化使用的是`Object.create(null)`，这样可以使创建出来的原型指向`null`，我们也这样做吧：

```javascript
MyModule._cache = Object.create(null);

MyModule._load = function (request) {    // request是我们传入的路径参数
  const filename = MyModule._resolveFilename(request);

  // 先检查缓存，如果缓存存在且已经加载，直接返回缓存
  const cachedModule = MyModule._cache[filename];
  if (cachedModule !== undefined) {
    return cachedModule.exports;
  }

  // 如果缓存不存在，我们就加载这个模块
  // 加载前先new一个MyModule实例，然后调用实例方法load来加载
  // 加载完成直接返回module.exports
  const module = new MyModule(filename);
  
  // load之前就将这个模块缓存下来，这样如果有循环引用就会拿到这个缓存，但是这个缓存里面的exports可能还没有或者不完整
  MyModule._cache[filename] = module;
  
  module.load(filename);
  
  return module.exports;
}
```

上述代码对应的源码看这里：[https://github.com/nodejs/node/blob/c6b96895cc74bc6bd658b4c6d5ea152d6e686d20/lib/internal/modules/cjs/loader.js#L735](https://github.com/nodejs/node/blob/c6b96895cc74bc6bd658b4c6d5ea152d6e686d20/lib/internal/modules/cjs/loader.js#L735)

可以看到上述源码还调用了两个方法：`MyModule._resolveFilename`和`MyModule.prototype.load`，下面我们来实现下这两个方法。

### `MyModule._resolveFilename`

`MyModule._resolveFilename`从名字就可以看出来，这个方法是通过用户传入的`require`参数来解析到真正的文件地址的，源码中这个方法比较复杂，因为按照前面讲的，他要支持多种参数：内置模块，相对路径，绝对路径，文件夹和第三方模块等等，如果是文件夹或者第三方模块还要解析里面的`package.json`和`index.js`。我们这里主要讲原理，所以我们就只实现通过相对路径和绝对路径来查找文件，并支持自动添加`js`和`json`两种后缀名:

```javascript
MyModule._resolveFilename = function (request) {
  const filename = path.resolve(request);   // 获取传入参数对应的绝对路径
  const extname = path.extname(request);    // 获取文件后缀名

  // 如果没有文件后缀名，尝试添加.js和.json
  if (!extname) {
    const exts = Object.keys(MyModule._extensions);
    for (let i = 0; i < exts.length; i++) {
      const currentPath = `${filename}${exts[i]}`;

      // 如果拼接后的文件存在，返回拼接的路径
      if (fs.existsSync(currentPath)) {
        return currentPath;
      }
    }
  }

  return filename;
}
```

上述源码中我们还用到了一个静态变量`MyModule._extensions`，这个变量是用来存各种文件对应的处理方法的，我们后面会实现他。

`MyModule._resolveFilename`对应的源码看这里：[https://github.com/nodejs/node/blob/c6b96895cc74bc6bd658b4c6d5ea152d6e686d20/lib/internal/modules/cjs/loader.js#L822](https://github.com/nodejs/node/blob/c6b96895cc74bc6bd658b4c6d5ea152d6e686d20/lib/internal/modules/cjs/loader.js#L822)

### `MyModule.prototype.load`

`MyModule.prototype.load`是一个实例方法，这个方法就是真正用来加载模块的方法，这其实也是不同类型文件加载的一个入口，不同类型的文件会对应`MyModule._extensions`里面的一个方法：

```javascript
MyModule.prototype.load = function (filename) {
  // 获取文件后缀名
  const extname = path.extname(filename);

  // 调用后缀名对应的处理函数来处理
  MyModule._extensions[extname](this, filename);

  this.loaded = true;
}
```

注意这段代码里面的`this`指向的是`module`实例，因为他是一个实例方法。对应的源码看这里: [https://github.com/nodejs/node/blob/c6b96895cc74bc6bd658b4c6d5ea152d6e686d20/lib/internal/modules/cjs/loader.js#L942](https://github.com/nodejs/node/blob/c6b96895cc74bc6bd658b4c6d5ea152d6e686d20/lib/internal/modules/cjs/loader.js#L942)

### 加载js文件: MyModule._extensions['.js']

前面我们说过不同文件类型的处理方法都挂载在`MyModule._extensions`上面的，我们先来实现`.js`类型文件的加载：

```javascript
MyModule._extensions['.js'] = function (module, filename) {
  const content = fs.readFileSync(filename, 'utf8');
  module._compile(content, filename);
}
```

可以看到`js`的加载方法很简单，只是把文件内容读出来，然后调了另外一个实例方法`_compile`来执行他。对应的源码看这里：[https://github.com/nodejs/node/blob/c6b96895cc74bc6bd658b4c6d5ea152d6e686d20/lib/internal/modules/cjs/loader.js#L1098](https://github.com/nodejs/node/blob/c6b96895cc74bc6bd658b4c6d5ea152d6e686d20/lib/internal/modules/cjs/loader.js#L1098)

### 编译执行js文件：MyModule.prototype._compile

`MyModule.prototype._compile`是加载JS文件的核心所在，也是我们最常使用的方法，这个方法需要将目标文件拿出来执行一遍，执行之前需要将它整个代码包裹一层，以便注入`exports, require, module, __dirname, __filename`，这也是我们能在JS文件里面直接使用这几个变量的原因。要实现这种注入也不难，假如我们`require`的文件是一个简单的`Hello World`，长这样：

```javascript
module.exports = "hello world";
```

那我们怎么来给他注入`module`这个变量呢？答案是执行的时候在他外面再加一层函数，使他变成这样：

```javascript
function (module) { // 注入module变量，其实几个变量同理
  module.exports = "hello world";
}
```

所以我们如果将文件内容作为一个字符串的话，为了让他能够变成上面这样，我们需要再给他拼接上开头和结尾，我们直接将开头和结尾放在一个数组里面:

```javascript
MyModule.wrapper = [
  '(function (exports, require, module, __filename, __dirname) { ',
  '\n});'
];
```

注意我们拼接的开头和结尾多了一个`()`包裹，这样我们后面可以拿到这个匿名函数，在后面再加一个`()`就可以传参数执行了。然后将需要执行的函数拼接到这个方法中间：

```javascript
MyModule.wrap = function (script) {
  return MyModule.wrapper[0] + script + MyModule.wrapper[1];
};
```

这样通过`MyModule.wrap`包装的代码就可以获取到`exports, require, module, __filename, __dirname`这几个变量了。知道了这些就可以来写`MyModule.prototype._compile`了:

```javascript
MyModule.prototype._compile = function (content, filename) {
  const wrapper = Module.wrap(content);    // 获取包装后函数体

  // vm是nodejs的虚拟机沙盒模块，runInThisContext方法可以接受一个字符串并将它转化为一个函数
  // 返回值就是转化后的函数，所以compiledWrapper是一个函数
  const compiledWrapper = vm.runInThisContext(wrapper, {
    filename,
    lineOffset: 0,
    displayErrors: true,
  });

  // 准备exports, require, module, __filename, __dirname这几个参数
  // exports可以直接用module.exports，即this.exports
  // require官方源码中还包装了一层，其实最后调用的还是this.require
  // module不用说，就是this了
  // __filename直接用传进来的filename参数了
  // __dirname需要通过filename获取下
  const dirname = path.dirname(filename);

  compiledWrapper.call(this.exports, this.exports, this.require, this,
    filename, dirname);
}
```

上述代码要注意我们注入进去的几个参数和通过`call`传进去的`this`:

> 1. **this**:`compiledWrapper`是通过`call`调用的，第一个参数就是里面的`this`，这里我们传入的是`this.exports`，也就是`module.exports`，也就是说我们`js`文件里面`this`是对`module.exports`的一个引用。
> 2. **exports**: `compiledWrapper`正式接收的第一个参数是`exports`，我们传的也是`this.exports`,所以`js`文件里面的`exports`也是对`module.exports`的一个引用。
> 3. **require**: 这个方法我们传的是`this.require`，其实就是`MyModule.prototype.require`，也就是`MyModule._load`。
> 4. **module**: 我们传入的是`this`，也就是当前模块的实例。
> 5. **__filename**：文件所在的绝对路径。
> 6. **__dirname**: 文件所在文件夹的绝对路径。

到这里，我们的JS文件其实已经记载完了，对应的源码看这里:[https://github.com/nodejs/node/blob/c6b96895cc74bc6bd658b4c6d5ea152d6e686d20/lib/internal/modules/cjs/loader.js#L1043](https://github.com/nodejs/node/blob/c6b96895cc74bc6bd658b4c6d5ea152d6e686d20/lib/internal/modules/cjs/loader.js#L1043)

### 加载json文件: MyModule._extensions['.json']

加载`json`文件就简单多了，只需要将文件读出来解析成`json`就行了：

```javascript
MyModule._extensions['.json'] = function (module, filename) {
  const content = fs.readFileSync(filename, 'utf8');
  module.exports = JSONParse(content);
}
```

## `exports`和`module.exports`的区别

网上经常有人问，`node.js`里面的`exports`和`module.exports`到底有什么区别，其实前面我们的手写代码已经给出答案了，我们这里再就这个问题详细讲解下。`exports`和`module.exports`这两个变量都是通过下面这行代码注入的。

```javascript
compiledWrapper.call(this.exports, this.exports, this.require, this,
    filename, dirname);
```

初始状态下，`exports === module.exports === {}`，`exports`是`module.exports`的一个引用，如果你一直是这样使用的:

```javascript
exports.a = 1;
module.exports.b = 2;

console.log(exports === module.exports);   // true
```

上述代码中，`exports`和`module.exports`都是指向同一个对象`{}`，你往这个对象上添加属性并没有改变这个对象本身的引用地址，所以`exports === module.exports`一直成立。

但是如果你哪天这样使用了:

```javascript
exports = {
  a: 1
}
```

或者这样使用了:

```javascript
module.exports = {
	b: 2
}
```

那其实你是给`exports`或者`module.exports`重新赋值了，改变了他们的引用地址，那这两个属性的连接就断开了，他们就不再相等了。**需要注意的是，你对`module.exports`的重新赋值会作为模块的导出内容，但是你对`exports`的重新赋值并不能改变模块导出内容，只是改变了`exports`这个变量而已，因为模块始终是`module`，导出内容是`module.exports`。**

## 循环引用

Node.js对于循环引用是进行了处理的，下面是官方例子：

`a.js`:

```js
console.log('a 开始');
exports.done = false;
const b = require('./b.js');
console.log('在 a 中，b.done = %j', b.done);
exports.done = true;
console.log('a 结束');
```

`b.js`:

```js
console.log('b 开始');
exports.done = false;
const a = require('./a.js');
console.log('在 b 中，a.done = %j', a.done);
exports.done = true;
console.log('b 结束');
```

`main.js`:

```js
console.log('main 开始');
const a = require('./a.js');
const b = require('./b.js');
console.log('在 main 中，a.done=%j，b.done=%j', a.done, b.done);
```

当 `main.js` 加载 `a.js` 时， `a.js` 又加载 `b.js`。 此时， `b.js` 会尝试去加载 `a.js`。 为了防止无限的循环，会返回一个 `a.js` 的 `exports` 对象的 **未完成的副本** 给 `b.js` 模块。 然后 `b.js` 完成加载，并将 `exports` 对象提供给 `a.js` 模块。

那么这个效果是怎么实现的呢？答案就在我们的`MyModule._load`源码里面，注意这两行代码的顺序:

```javascript
MyModule._cache[filename] = module;

module.load(filename);
```

上述代码中我们是先将缓存设置了，然后再执行的真正的`load`，顺着这个思路我能来理一下这里的加载流程:

> 1. `main`加载`a`，`a`在真正加载前先去缓存中占一个位置
> 2. `a`在正式加载时加载了`b`
> 3. `b`又去加载了`a`，这时候缓存中已经有`a`了，所以直接返回`a.exports`，即使这时候的`exports`是不完整的。

## 总结

1. `require`不是黑魔法，整个Node.js的模块加载机制都是`JS`实现的。
2. 每个模块里面的`exports, require, module, __filename, __dirname`五个参数都不是全局变量，而是模块加载的时候注入的。
3. 为了注入这几个变量，我们需要将用户的代码用一个函数包裹起来，拼一个字符串然后调用沙盒模块`vm`来实现。
4. 初始状态下，模块里面的`this, exports, module.exports`都指向同一个对象，如果你对他们重新赋值，这种连接就断了。
5. 对`module.exports`的重新赋值会作为模块的导出内容，但是你对`exports`的重新赋值并不能改变模块导出内容，只是改变了`exports`这个变量而已，因为模块始终是`module`，导出内容是`module.exports`。
6. 为了解决循环引用，模块在加载前就会被加入缓存，下次再加载会直接返回缓存，如果这时候模块还没加载完，你可能拿到未完成的`exports`。
7. Node.js实现的这套加载机制叫**CommonJS**。

**本文完整代码已上传GitHub：[https://github.com/dennis-jiang/Front-End-Knowledges/blob/master/Examples/Node.js/Module/MyModule/index.js](https://github.com/dennis-jiang/Front-End-Knowledges/blob/master/Examples/Node.js/Module/MyModule/index.js)**

## 参考资料

Node.js模块加载源码：[https://github.com/nodejs/node/blob/c6b96895cc74bc6bd658b4c6d5ea152d6e686d20/lib/internal/modules/cjs/loader.js](https://github.com/nodejs/node/blob/c6b96895cc74bc6bd658b4c6d5ea152d6e686d20/lib/internal/modules/cjs/loader.js)

Node.js模块官方文档：[http://nodejs.cn/api/modules.html](http://nodejs.cn/api/modules.html)

**文章的最后，感谢你花费宝贵的时间阅读本文，如果本文给了你一点点帮助或者启发，请不要吝啬你的赞和GitHub小星星，你的支持是作者持续创作的动力。**

**作者博文GitHub项目地址： [https://github.com/dennis-jiang/Front-End-Knowledges](https://github.com/dennis-jiang/Front-End-Knowledges)**

**作者掘金文章汇总：[https://juejin.im/post/5e3ffc85518825494e2772fd](https://juejin.im/post/5e3ffc85518825494e2772fd)**

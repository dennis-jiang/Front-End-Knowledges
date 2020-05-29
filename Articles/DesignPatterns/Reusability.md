本文是设计模式的第二篇文章，第一篇文章是[不知道怎么封装代码？看看这几种设计模式吧！](https://juejin.im/post/5ec737b36fb9a04799583002)，后面还会有`提高扩展性`，`提高代码质量`的设计模式，点个关注不迷路，哈哈~

想必大家都听说过`DRY`原则，其实就是`Don't repeat yourself(不要重复你自己)`，意思就是不要重复写一样的代码，换句话说就是要提高代码的复用性。那什么样的代码才算有好的复用性呢？

> 1. 对象可以重复利用。这个其实有点像我们关系型数据库的设计原则，数据表和关系表是分开的，数据表就是单纯的数据，没有跟其他表的关系，也没有业务逻辑，关系表才是存储具体的对应关系。当我们需要某个数据时，直接读这个表就行，而不用担心这个表会有其他的业务在里面。类似设计的还有redux，redux的store里面就是单纯的数据，并不对应具体的业务逻辑，业务如果需要改变数据需要发action才行。正是因为这种数据很单纯，所以我们需要的地方都可以拿来用，复用性非常高。所以我们设计数据或对象时，也要尽量让他可以复用。
> 2. 重复代码少。如果你写的代码重复度很高的话，说明你代码的抽象度不够。很多时候我们重复代码的产生都是因为我们可能需要写一个跟已经存在的功能类似的功能，于是我们就把之前的代码拷贝过来，把其中两行代码改了完事。这样做虽然功能实现了，但是却制造了大量重复代码，本文要讲的几种设计模式就是用来解决这个问题的，提高代码的抽象度，减少重复代码。
> 3. 模块功能单一。这意味着一个模块就专注于一个功能，我们需要做一个大功能时，就将多个模块组合起来就行。这就像乐高积木，功能单一的模块就像乐高积木的一小块，我们可以用10个小块拼成一个小汽车，也可以用20个小块拼成一个大卡车。但是如果我们模块本身做复杂了，做成了小汽车，我们是不能用两个小汽车拼成一个大卡车的，这复用性就降低了。

提高复用性的设计模式主要有`桥接模式`，`享元模式`，`模板方法模式`，下面我们分别来看下。

## 桥接模式

桥接模式人如其名，其实就相当于一个桥梁，把不同维度的变量桥接在一起来实现功能。假设我们需要实现三种形状（长方形，圆形，三角形），每种形状有三种颜色（红色，绿色，蓝色），这个需求有两个方案，一个方案写九个方法，每个方法实现一个图形：

```javascript
function redRectangle() {}
function greenRectangle() {}
function blueRectangle() {}
function redCircle() {}
function greenCircle() {}
function blueCircle() {}
function redTriangle() {}
function greenTriangle() {}
function blueTriangle() {}
```

上述代码虽然功能实现了，但是如果我们需求变了，我们要求再加一个颜色，那我们就得再加三个方法，每个形状加一个。这么多方法看着就很重复，意味着他有优化的空间。我们仔细看下这个需求，我们最终要画的图形有颜色和形状两个变量，这两个变量其实是没有强的逻辑关系的，完全是两个维度的变量。那我们可以将这两个变量拆开，最终要画图形的时候再桥接起来，就是这样：

```javascript
function rectangle(color) {     // 长方形
  showColor(color);
}

function circle(color) {     // 圆形
  showColor(color);
}

function triangle(color) {   // 三角形
  showColor(color);
}

function showColor(color) {   // 显示颜色的方法
  
}

// 使用时，需要一个红色的圆形
let obj = new circle('red');
```

使用桥接模式后我们的方法从`3 * 3`变成了`3 + 1`，而且如果后续颜色增加了，我们只需要稍微修改`showColor`方法，让他支持新颜色就行了。如果我们变量的维度不是2，而是3，这种优势会更加明显，前一种需要的方法是`x * y * z`个，桥接模式优化后是`x + y + z`个，这直接就是指数级的优化。所以这里桥接模式优化的核心思想是观察重复代码能不能拆成多个维度，如果可以的话就把不同维度拆出来，使用时再将这些维度桥接起来。

### 实例：毛笔和蜡笔

桥接模式其实我最喜欢的例子就是`毛笔和蜡笔`，因为这个例子非常直观，好理解。这个例子的需求是要画`细`，`中`,`粗`三种型号的线，每种型号的线需要5种颜色，如果我们用蜡笔来画就需要15支蜡笔，如果我们换毛笔来画，只需要3支毛笔就行了，每次用不同颜色的墨水，用完换墨水就行。写成代码就是这样，跟上面那个有点像:

```javascript
// 先来三个笔的类
function smallPen(color) {
  this.color = color;
}
smallPen.prototype.draw = function() {
  drawWithColor(this.color);    // 用color颜色来画画
}

function middlePen(color) {
  this.color = color;
}
middlePen.prototype.draw = function() {
  drawWithColor(this.color);    // 用color颜色来画画
}

function bigPen(color) {
  this.color = color;
}
bigPen.prototype.draw = function() {
  drawWithColor(this.color);    // 用color颜色来画画
}

// 再来一个颜色类
function color(color) {
  this.color = color;
}

// 使用时
new middlePen(new color('red')).draw();    // 画一个中号的红线
new bigPen(new color('green')).draw();     // 画一个大号的绿线
```

上述例子中蜡笔因为大小和颜色都是他本身的属性，没法分开，需要的蜡笔数量是两个维度的乘积，也就是15支，如果再多一个维度，那复杂度是指数级增长的。但是毛笔的大小和颜色这两个维度是分开的，使用时将他们桥接在一起就行，只需要三只毛笔，5瓶墨水，复杂度大大降低了。上面代码的颜色我新建了一个类，而上个例子画图形那里的颜色是直接作为参数传递的，这样做的目的是为了演示即使同一个设计模式也可以有不同的实现方案。具体采用哪种方案要根据我们实际的需求来，如果要桥接的只是颜色这么一个简单变量，完全可以作为参数传递，如果要桥接一个复杂对象，可能就需要一个类了。另外上述代码的三个笔的类看着就很重复，其实进一步优化还可以提取一个模板，也就是笔的基类，具体可以看看后面的模板方法模式。

### 实例：菜单项

这个例子的需求是：有多个菜单项，每个菜单项文字不一样，鼠标滑入滑出时文字的颜色也不一样。我们一般实现时可能这么写代码:

```javascript
function menuItem(word) {
  this.dom = document.createElement('div');
  this.dom.innerHTML = word;
}

var menu1 = new menuItem('menu1');
var menu2 = new menuItem('menu2');
var menu3 = new menuItem('menu3');

// 给每个menu设置鼠标滑入滑出事件
menu1.dom.onmouseover = function(){
  menu1.dom.style.color = 'red';
}
menu2.dom.onmouseover = function(){
  menu1.dom.style1.color = 'green';
}
menu3.dom.onmouseover = function(){
  menu1.dom.style1.color = 'blue';
}
menu1.dom.onmouseout = function(){
  menu1.dom.style1.color = 'green';
}
menu2.dom.onmouseout = function(){
  menu1.dom.style1.color = 'blue';
}
menu3.dom.onmouseout = function(){
  menu1.dom.style1.color = 'red';
}
```

上述代码看起来都好多重复的，为了消除这些重复代码，我们将事件绑定和颜色设置这两个维度分离开：

```javascript
// 菜单项类多接收一个参数color
function menuItem(word, color) {
  this.dom = document.createElement('div');
  this.dom.innerHTML = word;
  this.color = color;        // 将接收的颜色参数作为实例属性
}

// 菜单项类添加一个实例方法，用于绑定事件
menuItem.prototype.bind = function() {
  var that = this;      // 这里的this指向menuItem实例对象
  this.dom.onmouseover = function() {
    this.style.color = that.color.colorOver;    // 注意这里的this是事件回调里面的this,指向DOM节点
  }
  this.dom.onmouseout = function() {
    this.style.color = that.color.colorOut;
  }
}

// 再建一个类存放颜色，目前这个类的比较简单，后面可以根据需要扩展
function menuColor(colorOver, colorOut) {
  this.colorOver = colorOver;
  this.colorOut = colorOut;
}

// 现在新建菜单项可以直接用一个数组来循环了
var menus = [
  {word: 'menu1', colorOver: 'red', colorOut: 'green'},
  {word: 'menu2', colorOver: 'green', colorOut: 'blue'},
  {word: 'menu3', colorOver: 'blue', colorOut: 'red'},
]

for(var i = 0; i < menus.length; i++) {
  // 将参数传进去进行实例化，最后调一下bind方法，这样就会自动绑定事件了
  new menuItem(menus[i].word, new menuColor(menus[i].colorOver, menus[i].colorOut)).bind();
}
```

上述代码也是一样的思路，我们将事件绑定和颜色两个维度分别抽取出来，使用的时候再桥接，从而减少了大量相似的代码。

## 享元模式

当我们观察到代码中有大量相似的代码块，他们做的事情可能都是一样的，只是每次应用的对象不一样，我们就可以考虑用享元模式。现在假设我们有一个需求是显示多个弹窗，每个弹窗的文字和大小不同：

```javascript
// 已经有一个弹窗类了
function Popup() {}

// 弹窗类有一个显示的方法
Popup.prototype.show = function() {}
```

如果我们不用享元模式，一个一个弹就是这样:

```javascript
var popup1 = new Popup();
popup1.show();

var popup2 = new Popup();
popup2.show();
```

我们仔细观察上面的代码，发现这两个实例做的事情都是一样的，都是显示弹窗，但是每个弹窗的大小文字不一样，那`show`方法是不是就可以提出来公用，把不一样的部分作为参数传进去就行。这种思路其实就是享元模式，我们改造如下:

```javascript
var popupArr = [
  {text: 'popup 1', width: 200, height: 400},
  {text: 'popup 2', width: 300, height: 300},
]

var popup = new Popup();
for(var i = 0; i < popupArr.length; i++) {
  popup.show(popupArr[i]);    // 注意show方法需要接收参数
}
```

### 实例：文件上传

我们再来看一个例子，假如我们现在有个需求是上传文件，可能需要上传多个文件，我们一般写代码可能就是这样:

```javascript
// 一个上传的类
function Uploader(fileType, file) {
  this.fileType = fileType;
  this.file = file;
}

Uploader.prototype.init = function() {}  // 初始化方法
Uploader.prototype.upload = function() {}  // 具体上传的方法

var file1, file2, file3;    // 多个需要上传的文件
// 每个文件都实例化一个Uploader
new Uploader('img', file1).upload();
new Uploader('txt', file2).upload();     
new Uploader('mp3', file3).upload();  
```

上述代码我们需要上传三个文件于是实例化了三个`Uploader`，但其实这三个实例只有文件类型和文件数据不一样，其他的都是一样的，我们可以重用一样的部分，不一样的部分作为参数传进去就行了，用享元模式优化如下:

```javascript
// 文件数据扔到一个数组里面
var data = [
  {filetype: 'img', file: file1},
  {filetype: 'txt', file: file2},
  {filetype: 'mp3', file: file3},
];

// Uploader类改造一下, 构造函数不再接收参数
function Uploader() {}

// 原型上的其他方法保持不变
Uploader.prototype.init = function() {}

// 文件类型和文件数据其实是上传的时候才用，作为upload的参数
Uploader.prototype.upload = function(fileType, file) {}

// 调用时只需要一个实例，循环调用upload就行
var uploader = new Uploader();
for(var i = 0; i < data.length; i++) {
  uploader.upload(data[i].filetype, data[i].file)
}
```

上述代码我们通过参数的抽取将3个实例简化为1个，提高了`Uploader`类的复用性。上述两个例子其实是类似的，但他们只是享元模式的一种形式，只要是符合这种思想的都可以叫享元模式，比如jQuery里面的`extend`方法也用到了享元模式。

### 实例：jQuery的extend方法

jQuery的`extend`方法是大家经常用的一个方法了，他接收一个或者多个参数：

> 1. 只有一个参数时，`extend`会将传入的参数合并到jQuery自己身上。
> 2. 传入两个参数obj1和obj2时，`extend`会将obj2合并到obj1上。

根据上述需求，我们很容易自己实现：

```javascript
$.extend = function() {
  if(arguments.length === 1) {
    for(var item in arguments[0]) {
      this[item] = arguments[0][item]
    }
  } else if(arguments.length === 2) {
    for(var item in arguments[1]) {
      arguments[0][item] = arguments[1][item];
    }
  }
}
```

上述代码的`this[item] = arguments[0][item]`和`arguments[0][item] = arguments[1][item]`看着就很像，我们想想能不能优化下他，仔细看着两行代码，他们不同的地方是拷贝的目标和来源不一样，但是拷贝的操作却是一样的。所以我们用享元模式优化下，将不同的地方抽出来，保持共用的拷贝不变:

```javascript
$.extend = function() {
  // 不同的部分抽取出两个变量
  var target  = this;                  // 默认为this，即$本身
  var source = arguments[0];           // 默认为第一个变量
  
  // 如果有两个参数, 改变target和source
  if(arguments.length === 2) {       
     target = arguments[0];
  	 source = arguments[1];
  }

  // 共同的拷贝操作保持不变
  for(var item in source) {
    target[item] = source[item];
  }
}
```

## 模板方法模式

模板方法模式其实类似于继承，就是我们先定义一个通用的模板骨架，然后后面在这个基础上继续扩展。我们通过一个需求来看下他的基本结构，假设我们现在需要实现一个导航组件，但是这个导航类型还比较多，有的带消息提示，有的是横着的，有的是竖着的，而且后面还可能会新增类型：

```javascript
// 先建一个基础的类
function baseNav() {
}

baseNav.prototype.action = function(callback){}  //接收一个回调进行特异性处理
```

上述代码我们先建了一个基础的类，里面只有最基本的属性和方法，其实就相当于一个模板，而且在具体的方法里面还可以接收回调，这样后面派生出来的类可以根据自己的需求传入回调。模板方法模式其实就是类似于面向对象的基类和派生类的关系，下面我们再来看一个例子。

### 实例：弹窗

还是之前用过的弹窗例子，我们要做一个大小文字可能不同的弹窗组件，只是这次我们的弹窗还有取消和确定两个按钮，这两个按钮在不同场景下可能有不同的行为，比如发起请求什么的。但是他们也有一个共同的操作，就是点击这两个按钮后弹窗都会消失，这样我们就可以把共同的部分先写出来，作为一个模板：

```javascript
function basePopup(word, size) {
  this.word = word;
  this.size = size;
  this.dom = null;
}

basePopup.prototype.init = function() {
  // 初始化DOM元素
  var div = document.createElement('div');
  div.innerHTML = this.word;
  div.style.width = this.size.width;
  div.style.height = this.size.height;
  
  this.dom = div;
}

// 取消的方法
basePopup.prototype.cancel = function() {
  this.dom.style.display = 'none';
}

// 确认的方法
basePopup.prototype.confirm = function() {
  this.dom.style.display = 'none';
}
```

现在我们有了一个基础的模板，那假如我们还需要在点击取消或者确认后再进行其他操作，比如发起请求，我们可以以这个模板为基础再加上后面需要的操作就行：

```javascript
// 先继承basePopup
function ajaxPopup(word, size) {
  basePopup.call(this, word, size);
}
ajaxPopup.prototype = new basePopup();
ajaxPopup.prototype.constructor = ajaxPopup;       
// 上面是一个继承的标准写法，其实就相当于套用了模板

// 下面来加上需要的发起网络请求的操作
var cancel = ajaxPopup.prototype.cancel;    // 先缓存模板上的cancel方法
ajaxPopup.prototype.cancel = function() {
  // 先调模板的cancel
  cancel.call(this);     
  // 再加上特殊的处理，比如发起请求
  $.ajax();
}

// confirm方法是一样的处理
var confirm = ajaxPopup.prototype.confirm;
ajaxPopup.prototype.confirm = function() {
  confirm.call(this);
  $.ajax();
}
```

上面这个例子是通过继承实现了模板方法模式，但是这个模式并不是一定要用继承的，他强调的是将一些基础部分提取出来作为模板，后面更多的操作可以在这个基础上进行扩展。

### 实例：算法计算器

这个例子我们就不用继承了，他的需求是我们现在有一系列的算法，但是这些算法在具体用的时候可能还会添加一些不同的计算操作，需要添加的操作可能在这个算法前执行，也可能在这个算法后执行。

```javascript
// 先定义一个基本的类
function counter() {
  
}

// 类上有一个计算方法
counter.prototype.count = function(num) {
  // 里面有一个算法本身的基本计算方法
  function baseCount(num) {
    // 这里的算法是什么不重要，我们这里就加1吧
    num += 1;
    return num;
  }
}
```

根据需求我们要解决的问题是在基本算法计算时可能还有其他计算操作，这些操作可能在基本计算前，也可能在基本计算之后，所以我们要在这个计算类上留出可扩展的接口：

```javascript
function counter() {
  // 添加两个队列，用于基本算法前或者后执行
  this.beforeCounting = [];
  this.afterCounting = [];
}

// 添加一个接口，接收基本算法计算前应该进行的计算
counter.prototype.before = function(fn) {
  this.beforeCounting.push(fn);       // 直接将方法放进数组里面
}

// 再添加一个接口，接收基本算法计算后应该进行的计算
counter.prototype.after = function(fn) {
  this.afterCounting.push(fn);       
}

// 改造计算方法，让他按照计算前-基本计算-计算后执行
counter.prototype.count = function(num) {
  function baseCount(num) {
    num += 1;
    return num;
  }
  
  var result = num;
  var arr = [baseCount];     // 将需要进行的计算都放到这个数组里面
  
  arr = this.beforeCounting.concat(arr);     // 计算前操作放到数组前面
  arr = arr.concat(this.afterCounting);      // 计算后操作放到数组后面
  
  // 将数组全部按顺序拿出来执行
  while(arr.length > 0) {
    result = arr.shift()(result);
  }
  
  return result;
}

// 现在counter就可以直接使用了
var counterIntance = new counter();
counterIntance.before(num => num + 10);      // 计算前先加10
counterIntance.after(num => num - 5);        // 计算后再减5

counterIntance.count(2);     // 2 + 10 + 1 - 5  = 8
```

这次我们没有用继承了，但是我们仍然是先定义了一个基本的操作骨架，然后在这个骨架上去扩展不同地方需要的特殊操作。

## 总结

1. 如果我们的代码中出现了大量相似的代码块，往往意味着有进一步的优化空间。
2. 如果这些重复代码块可以拆分成不同的维度，那可以试试桥接模式，先将维度拆开，再桥接这些维度来使用。
3. 如果这些重复代码有一部分操作是一样的，但是每次操作的对象不一样，我们可以考虑用享元模式将公有操作提取成方法，将私有部分作为参数传进去。
4. 如果这些重复代码有一些基本操作是一样的，但是具体应用时需要的功能更多，我们可以考虑将这些基本操作提取成模板，然后在模板上留出扩展接口，需要的地方可以通过这些接口来扩展功能，有点类似于继承，但实现方式并不仅限于继承。
5. 我们将重复部分提取出来，其他地方也可以用，其实就是提高了代码的复用性。
6. 还是那句话，设计模式没有固定的范式，主要还是要理解他的思想，代码在不同地方可以有不同的实现方式。

**文章的最后，感谢你花费宝贵的时间阅读本文，如果本文给了你一点点帮助或者启发，请不要吝啬你的赞和GitHub小星星，你的支持是作者持续创作的动力。**

**本文素材来自于[网易高级前端开发工程师微专业](https://mooc.study.163.com/smartSpec/detail/1202851605.htm)唐磊老师的设计模式课程。**

**作者博文GitHub项目地址： [https://github.com/dennis-jiang/Front-End-Knowledges](https://github.com/dennis-jiang/Front-End-Knowledges)**

**作者掘金文章汇总：[https://juejin.im/post/5e3ffc85518825494e2772fd](https://juejin.im/post/5e3ffc85518825494e2772fd)**
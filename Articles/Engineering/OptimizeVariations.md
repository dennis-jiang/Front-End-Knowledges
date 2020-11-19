这段时间写了一堆源码解析，这篇文章想换换口味，跟大家分享一个我工作中遇到的案例。毕竟作为一个打工人，上班除了摸鱼看源码外，砖还是要搬的。本文会分享一个使用恰当的数据结构来进行性能优化，从而大幅提高响应速度的故事，提高有几百倍那么多。

事情是这样的，我现在供职一家外企，我们有一个给外国人用的线下卖货的APP，卖的商品有衣服，鞋子，可乐什么的。某天，产品经理找到我，提了一个需求：**需要支持三层的产品选项**。听到这个需求，我第一反应是我好像没有见到过三层的产品选项，毕竟我也是一个十来年的资深剁手党，一般的产品选项好像最多两层，比如下面是某电商网站一个典型的鞋子的选项：

<img src="../../images/engineering/OptimizeVariations/image-20201116172602218.png" alt="image-20201116172602218" style="zoom:50%;" />

这个鞋子就是两层产品选项，一个是颜色，一个是尺码，颜色总共有11种，尺码总共也是11种。为了验证我的直觉，我把我手机上所有的购物APP，啥淘宝，京东，拼多多，苏宁易购全部打开看了一遍。**在我看过的商品中，没有发现一个商品有三层选项的，最多也就两层**。

**本文可运行的示例代码已经上传GitHub，大家可以拿下来玩玩：[https://github.com/dennis-jiang/Front-End-Knowledges/tree/master/Examples/DataStructureAndAlgorithm/OptimizeVariations](https://github.com/dennis-jiang/Front-End-Knowledges/tree/master/Examples/DataStructureAndAlgorithm/OptimizeVariations)**

## 为什么没人做三层选项？

一两家不做这个，可能是各家的需求不一样，但是大家都不做，感觉事情不对头。经过仔细分析后，我觉得不做三层选项可能有以下两个原因：

### 1. 三层选项可能是个伪需求

上面这个鞋子有11种颜色，11种尺码，意味着这些选项后面对应的是`11 * 11`，总共`121`个商品。如果再来个第三层选项，假设第三层也有`11`个选项，那对应的商品总共就是`11 * 11 * 11`，也就是`1331`个商品，好多店铺总共可能都没有`1331`个商品。也就是说，第三层选项可能是个伪需求，用户并没有那么多选项放在第三层，还是以上面的鞋子为例，除了颜色，尺码外，非要再添一个层级，那只能是性别了，也就是男鞋和女鞋。对于男鞋和女鞋来说，版型，尺码这些很不一样，一般都不会放到一个商品下面，更常用的做法是分成两个商品，各自有自己的颜色和尺码。

### 2. 技术实现有问题

仅仅是加上第三层选项这个功能并没有什么难的，也就是多展示几个可以点击的按钮而已，点击逻辑跟两层选项并没有太大区别。但是细想下去，我发现了他有潜在的性能问题。以上面这双鞋子为例，我从后端API拿到的数据是这样的：

```javascript
const merchandise = {
  // variations存放的是所有选项
  variations: [
    {
      name: '颜色',
      values: [
        { name: '限量版574海军蓝' },
        { name: '限量版574白粉' },
        // 下面还有9个
      ]
    },
    {
      name: '尺码',
      values: [
        { name: '38' },
        { name: '39' },
        // 下面还有9个
      ]
    },
  ],
  // products数组存放的是所有商品
  products: [
    {
      id: 1,
      price: 208,
      // 与上面variations的对应关系在每个商品的variationMappings里面
      variationMappings: [
        { name: '颜色', value: '限量版574白粉' },
        { name: '尺码', value: '38'},
      ]
    },
    // 下面还有一百多个产品
  ]
}
```

上面这个结构本身还是挺清晰的，`merchandise.variations`是一个数组，有几层选项，这个数组就有几个对象，每个对象的`name`就是当前层级的名字，`values`就是当前层级包含的选项，所以`merchandise.variations`可以直接拿来显示在UI上，将他们按照层级渲染成按钮就行。

上面图片中，用户选择了第一层的`限量版574白粉`，第二层的`40`，`41`等不存在的商品就自动灰掉了。用上面的数据结构可以做到这个功能，当用户选择`限量版574白粉`的时候，我们就去遍历`merchandise.products`这个数组，这个数组的一个项就是一个商品，这个商品上的`variationMappings`会有当前商品的`颜色`和`尺码`信息。对于我当前的项目来说，如果这个商品可以卖，他就会在`merchandise.products`这个数组里面，如果不可以卖，这个数组里面压根就不会有这个商品。比如上图的`限量版574白粉`，`40`码的组合就不会出现在`merchandise.products`里面，查找的时候找不到这个组合，那就会将它变为灰色，不可以点。

所以对于`限量版574白粉`，`40`这个鞋子来说，为了知道它需不需要灰掉，我需要整个遍历`merchandise.products`这个数组。按照前面说的`11`个颜色，`11`个尺码来说，最多会有`121`个商品，也就是最多查找`121`次。同样的要知道`限量版574白粉`，`41`这个商品可以不可以卖，又要整个遍历商品数组，11个尺码就需要将商品数组整个遍历11次。对于两层选项来说，`11 * 11`已经算比较多的了，每个尺码百来次运算可能还不会有严重的性能问题。**但是如果再加一层选项，新加这层假如也有`11`个可选项，这复杂度瞬间就指数增长了！**现在我们的商品总数是`11 * 11 * 11`，也就是`1331`个商品，假如第三层是`性别`，现在为了知道`限量版574白粉`，`40`，`男性`这个商品可不可以卖，我需要遍历`1331`个商品，如果遍历`121`个商品需要`20ms`，还比较流畅，那遍历`1331`个商品就需要`220ms`，这明显可以感觉到卡顿了，在某些硬件较差的设备上，这种卡顿会更严重，变得不可接受了。而且我们APP使用的技术是React Native，本身性能就比原生差，这样一来，用户可能就怒而卸载了！

我拿着上述对需求的疑问，和对性能的担心找到了产品经理，发生了如下对话：

> 我：大佬，我发现市面上好像没有APP支持三层选项的，这个需求是不是有问题哦，而且三层选项相较于两层选项来说，复杂度是指数增长，可能会有性能问题，用户用起来会卡的。
>
> 产品经理：兄弟，你看的都是国内的APP，但是我们这个是给外国人用的，人家外国人就是习惯这么用，咱要想卖的出去就得满足他们的需求。太卡了肯定不行，性能问题，想办法解决嘛，这就是在UI上再加几个按钮，设计图都跟以前是一样的，给你两天时间够了吧~
>
> 我：啊！？额。。。哦。。。

咱也不认识几个外国人，咱也不敢再问，都说了是用户需求，咱必须满足了产品才卖的出去，产品卖出去了咱才有饭吃，想办法解决吧！

## 解决方案

看来这个需求是必须要做了，这个功能并不复杂，因为三层选项可以沿用两层选项的方案，继续去遍历商品数组，但是这个复杂度增长是指数级的，用户用起来会卡。现在，我需要思考一下，有没有其他方案可以提高性能。经过仔细思考，我发现，这种指数级的复杂度是来自于我们整个数组的遍历，如果我能够找到一个方法不去遍历这个数组，立即就能找到`限量版574白粉`，`40`，`男性`对应的商品存不存在就好了。

这个具体的问题转换一下，其实就是：**在一个数组中，通过特定的过滤条件，查找符合条件的一个项。**嗯，查找，听起来蛮耳熟的，现在我之所以需要去遍历这个数组，是因为这些查找条件跟商品间没有一个直接的对应关系，如果我能建立一个直接的对应关系，不就可以一下就找到了吗？我想到了：**查找树**。**假如我重组这些层级关系，将它们组织为一颗树，每个商品都对应树上的一个叶子节点，我可以将三层选项的查找复杂度从$$O(n^3)$$降到$$O(1)$$。**

### 两层查找树

为了说明白这个算法，我先简化这个问题，假设我们现在有两层选项，`颜色`和`尺码`，每层选项有两个可选项：

1. 颜色：白色，红色
2. 尺码：39，40

我们现在对应有4个商品：

1. 一号商品：productId为1，白色，39码
2. 二号商品：productId为2，白色，40码
3. 三号商品：productId为3，红色，39码
4. 四号商品：productId为4，红色，40码

如果按照最简单的做法，为了查找`红色`的`39码`鞋子存不存在，我们需要遍历所有的这四个商品，这时候的时间复杂度为$$O(n^2)$$。但是如果我们构建像下面这样一颗树，可以将时间复杂度降到$$O(1)$$：

![image-20201117160534500](../../images/engineering/OptimizeVariations/image-20201117160534500.png)

上面这颗树，我们忽略`root`节点，在本例中他并没有什么用，仅仅是一个树的入口，这棵树的第一层淡黄色节点是我们第一层选项`颜色`，第二层淡蓝色节点是我们的第二层选项`尺码`，只是每个`颜色`节点都会对应所有的`尺码`，这样我们最后第二层的叶子节点其实就对应了具体的商品。现在我们要查找`红色`的`39码`鞋子，只需要看图中红色箭头指向的节点上有没有商品就行了。

那这种数据结构在JS中该怎么表示呢？其实很简单，一个对象就行了，像这样：

```javascript
const tree = {
  "颜色：白色": {
    "尺码：39": { productId: 1 },
    "尺码：40": { productId: 2 }
  },
  "颜色：红色": {
    "尺码：39": { productId: 3 },
    "尺码：40": { productId: 4 }
  }
}
```

**有了上面这个数据结构，我们要查找`红色`的`39码`直接取值`tree["颜色：红色"]["尺码：39"]`就行了，这个复杂度瞬间就变为$$O(1)$$了。**

### 三层查找树

理解了上面的两层查找树，要将它扩展到三层就简单了，直接再加一层就行了。假如我们现在第三层选项是性别，有两个可选项`男`和`女`，那我们的查找树就是这样子的：

![image-20201118133333379](../../images/engineering/OptimizeVariations/image-20201118133333379.png)

对应的JS对象：

```javascript
const tree = {
  "颜色：白色": {
    "尺码：39": { 
    	"性别：男": { productId: 1 },
      "性别：女": { productId: 2 },
    },
    "尺码：40": { 
    	"性别：男": { productId: 3 },
      "性别：女": { productId: 4 },
    }
  },
  "颜色：红色": {
    "尺码：39": { 
    	"性别：男": { productId: 5 },
      "性别：女": { productId: 6 },
    },
    "尺码：40": { 
    	"性别：男": { productId: 7 },
      "性别：女": { productId: 8 },
    }
  }
}
```

**同样的，假如我们要查找一个`白色`的，`39码`，`男`的鞋子，直接`tree["颜色：白色"]["尺码：39"]["性别：男"]`就行了，这个时间复杂度也是$$O(1)$$。**

### 写代码

上面算法都弄明白了，剩下的就是写代码了，我们主要需要写的代码就是用API返回的数据构建一个上面的`tree`这种结构就行了，一次遍历就可以做到。比如上面这个三层查找树对应的API返回的结构是这样的：

```javascript
const merchandise = {
  variations: [
    {
      name: '颜色',
      values: [
        { name: '白色' },
        { name: '红色' },
      ]
    },
    {
      name: '尺码',
      values: [
        { name: '39' },
        { name: '40' },
      ]
    },
    {
      name: '性别',
      values: [
        { name: '男' },
        { name: '女' },
      ]
    },
  ],
  products: [
    {
      id: 1,
      variationMappings: [
        { name: '颜色', value: '白色' },
        { name: '尺码', value: '39' },
        { name: '性别', value: '男' }
      ]
    }
    // 下面还有7个商品，我就不重复了
  ]
}
```

为了将API返回的数据转换为我们的树形结构数据我们写一个方法：

```javascript
function buildTree(apiData) {
  const tree = {};
  const { variations, products } = apiData;

  // 先用variations将树形结构构建出来，叶子节点默认值为null
  addNode(tree, 0);
  function addNode(root, deep) {
    const variationName = variations[deep].name;
    const variationValues = variations[deep].values;

    for (let i = 0; i < variationValues.length; i++) {
      const nodeName = `${variationName}：${variationValues[i].name}`;
      if (deep === 2) {
        root[nodeName] = null
      } else {
        root[nodeName] = {};
        addNode(root[nodeName], deep + 1);
      }
    }
  }

  // 然后遍历一次products给树的叶子节点填上值
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const { variationMappings } = product;
    const level1Name = `${variationMappings[0].name}：${variationMappings[0].value}`;
    const level2Name = `${variationMappings[1].name}：${variationMappings[1].value}`;
    const level3Name = `${variationMappings[2].name}：${variationMappings[2].value}`;
    tree[level1Name][level2Name][level3Name] = product;
  }

  // 最后返回构建好的树
  return tree;
}
```

然后用上面的API测试数据运行下看下效果，发现构建出来的树完全符合我们的预期：

![image-20201117173553941](../../images/engineering/OptimizeVariations/image-20201117173553941.png)

### 这就好了吗？

现在我们有了一颗查找树，当用户选择`红色`，`40`码后，为了知道对应的`男`可不可以点，我们不需要去遍历所有的商品了，而是可以直接从这个结构上取值。但是这就大功告成了吗？**并没有！**再仔细看下我们构建出来的数据结构，层级关系是固定的，第一层是颜色，第二层是尺码，第三层是性别，而对应的商品是放在第三层性别上的。**也就是说使用这个结构，用户必须严格按照，先选颜色，再选尺码，然后我们看看性别这里哪个该灰掉。如果他不按照这个顺序，比如他先选了性别`男`，然后选尺码`40`，这时候我们应该计算最后一个层级`颜色`哪些该灰掉。但是使用上面这个结构我们是算不出来的，因为我们并没有`tree["性别：男"]["尺码：40"]`这个对象。**

这怎么办呢？我们没有`性别-尺码-颜色`这种顺序的树，那我们就建一颗呗！这当然是个方法，但是用户还可能有其他的操作顺序呀，如果我们要覆盖用户所有可能的操作顺序，总共需要多少树呢？这其实是`性别`，`尺码`，`颜色`这三个变量的一个全排列，也就是$$A_3^3$$，总共`6`颗树。像我这样的懒人，让我建6棵树，我实在懒得干。如果不建这么多树，需求又覆盖不了，怎么办呢，有没有偷懒的办法呢？如果我能在需求上动点手脚，是不是可以规避这个问题？带着这个思路，我想到了两点：

#### 1. 给一个默认值。

用户打开商品详情页的时候，默认选中第一个可售商品。这样就相当于我们一开始就帮用户按照`颜色-尺码-性别`这个顺序选中了一个值，给了他一个默认的操作顺序。

#### 2. 不提供取消功能，只能切换选项

如果提供取消功能，他将我们提供的`颜色-尺码-性别`默认选项取消掉，又可以选成`性别-尺码-颜色`了。不提供取消功能，只能通过选择其他选项来切换，只能从`红色`换成`白色`，而不能取消`红色`，其他的一样。这样我们就能永远保证`颜色-尺码-性别`这个顺序，用户操作只是只是每个层级选中的值不一样，层级顺序并不会变化，我们的查找树就一直有效了。而且我发现某些购物网站也不能取消选项，不知道他们是不是也遇到了类似的问题。

对需求做这两点修改并不会对用户体验造成多大影响，跟产品经理商量后，她也同意了。这样我就从需求上干掉了另外5棵树，偷懒成功！

下面是三层选项跑起来的样子：

![Nov-18-2020 17-42-28](../../images/engineering/OptimizeVariations/run.gif)

### 还有一件事

前面的方案我们解决了查找的性能问题，但是引入了一个新问题，那就是需要创建这颗查找树。创建这颗查找树还是需要对商品列表进行一次遍历，这是不可避免的，为了更顺滑的用户体验，我们应该尽量将这个创建过程隐藏在用户感知不到的地方。我这里是将它整合到了商品详情页的加载状态中，用户点击进入商品详情页，我们要去API取数据，不可避免的会有一个加载状态，会转个圈什么的。我将这个遍历过程也做到了这个转圈中，当API数据返回，并且查找树创建完成后，转圈才会结束。这在理论上会延长转圈的时间，但是本地的遍历再慢也会比网络请求快点，所以用户感知并不明显。当转圈结束后，所有数据都准备就绪了，用户操作都是$$O(1)$$的复杂度，做到了真正的丝般顺滑~

#### 为什么不让后端创建这棵树？

上面的方案都是在前端创建这颗树，那有没有可能后端一开始返回的数据就是这样的，我直接拿来用就行，这样我又可以偷懒了~我还真去找过后端，可他给我说：“我也想偷懒！”开个玩笑，真是情况是，这个商品API是另一个团队维护的微服务，他们提供的数据不仅仅给我这一个终端APP使用，也给公司其他产品使用，所以要改返回结构涉及面太大，根本改不动。

### 封装代码

其实我们这个方案实现本身是比较独立的，其他人要是用的话，他也不关心你里面是棵树还是颗草，只要传入选择条件，能够返回正确的商品就行，所以我们可以将它封装成一个类。

```javascript
class VariationSearchMap {
    constructor(apiData) {
        this.tree = this.buildTree(apiData);
    }

  	// 这就是前面那个构造树的方法
    buildTree(apiData) {
        const tree = {};
        const { variations, products } = apiData;

        // 先用variations将树形结构构建出来，叶子节点默认值为null
        addNode(tree, 0);
        function addNode(root, deep) {
            const variationName = variations[deep].name;
            const variationValues = variations[deep].values;

            for (let i = 0; i < variationValues.length; i++) {
                const nodeName = `${variationName}：${variationValues[i].name}`;
                if (deep === variations.length - 1) {
                    root[nodeName] = null;
                } else {
                    root[nodeName] = {};
                    addNode(root[nodeName], deep + 1);
                }
            }
        }

        // 然后遍历一次products给树的叶子节点填上值
        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            const { variationMappings } = product;
            const level1Name = `${variationMappings[0].name}：${variationMappings[0].value}`;
            const level2Name = `${variationMappings[1].name}：${variationMappings[1].value}`;
            const level3Name = `${variationMappings[2].name}：${variationMappings[2].value}`;
            tree[level1Name][level2Name][level3Name] = product;
        }

        // 最后返回构建好的树
        return tree;
    }

    // 添加一个方法来搜索商品，参数结构和API数据的variationMappings一样
    findProductByVariationMappings(variationMappings) {
        const level1Name = `${variationMappings[0].name}：${variationMappings[0].value}`;
        const level2Name = `${variationMappings[1].name}：${variationMappings[1].value}`;
        const level3Name = `${variationMappings[2].name}：${variationMappings[2].value}`;

        const product = this.tree[level1Name][level2Name][level3Name];

        return product;
    }
}
```

然后使用的时候直接`new`一下就行：

```javascript
const variationSearchMap = new VariationSearchMap(apiData);    // new一个实例出来

// 然后就可以用这个实例进行搜索了
const searchCriteria = [
    { name: '颜色', value: '红色' },
    { name: '尺码', value: '40' },
    { name: '性别', value: '女' }
];
const matchedProduct = variationSearchMap.findProductByVariationMappings(searchCriteria);
console.log('matchedProduct', matchedProduct);    // { productId: 8 }
```

## 总结

**本文讲述了一个我工作中实际遇到的需求，分享了我的实现和优化思路，供大家参考。我的实现方案不一定完美，如果大家有更好的方案，欢迎在评论区讨论~**

**本文可运行的示例代码已经上传GitHub，大家可以拿下来玩玩：[https://github.com/dennis-jiang/Front-End-Knowledges/tree/master/Examples/DataStructureAndAlgorithm/OptimizeVariations](https://github.com/dennis-jiang/Front-End-Knowledges/tree/master/Examples/DataStructureAndAlgorithm/OptimizeVariations)**

下面再来回顾下本文的要点：

1. 本文要实现的需求是一个商品的三层选项。
2. 当用户选择了两层后，第三层选项应该自动计算出哪些能卖，哪些不能卖。
3. 鉴于后端API返回选项和商品间没有直接的对应关系，为了找出能卖还是不能卖，我们需要遍历所有商品。
4. 当总商品数量不多的时候，所有商品遍历可能不会产生明显的性能问题。
5. 但是当选项增加到三层，商品数量的增加是指数级的，性能问题就会显现出来。
6. 对于$$O(n^3)$$这种写代码时就能预见的性能问题，我们不用等着报BUG了才处理，而是开发时直接就解决了。
7. 本例要解决的是一个查找问题，所以我想到了建一颗树，直接将$$O(n^3)$$的复杂度降到了$$O(1)$$。
8. 但是一颗树并不能覆盖所有的用户操作，要覆盖所有的用户操作需要6棵树。
9. 出于偷懒的目的，我调整需求和交互砍掉了5颗树。真实原因是树太多了，会占用更多的内存空间，也不好维护。有时候适当的调整需求和交互也可以达到优化性能的效果，性能优化可以将交互和技术结合起来思考。
10. 这个树的搜索模块可以单独封装成一个类，外部使用者，不需要知道细节，直接调用接口查找就行。
11. **前端会点数据结构还是有用的，本文这种场景下还很有必要。**

**文章的最后，感谢你花费宝贵的时间阅读本文，如果本文给了你一点点帮助或者启发，请不要吝啬你的赞和GitHub小星星，你的支持是作者持续创作的动力。**

**作者博文GitHub项目地址： [https://github.com/dennis-jiang/Front-End-Knowledges](https://github.com/dennis-jiang/Front-End-Knowledges)**

**作者掘金文章汇总：[https://juejin.im/post/5e3ffc85518825494e2772fd](https://juejin.im/post/5e3ffc85518825494e2772fd)**

**我也搞了个公众号[进击的大前端]，不打广告，不写水文，只发高质量原创，欢迎关注~**
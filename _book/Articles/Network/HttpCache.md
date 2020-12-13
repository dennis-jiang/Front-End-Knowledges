上一篇文章我写了[koa-static的源码解析](https://juejin.cn/post/6903350655474204680)，其中用到了`HTTP`的缓存策略，给返回的静态文件设置了一些缓存的头，比如`Cache-Control`之类的。于是我就跟朋友讨论了一下`HTTP`的缓存策略：

朋友说：“`HTTP`里面控制缓存的头(`header`)太多了，啥`Cache-Control`，`ETag`，`Last-Modified`，一大堆，乱七八糟的，而且之间逻辑关系不强，要掌握基本靠背！”

我有点惊讶：“为什么要去背这个呢？所有的技术都是为了解决问题而存在的，不了解问题而去单纯的学习技术，去，背，去，死记，确实很枯燥，而且效果不好。**`HTTP`缓存策略只是为了解决客户端和服务端信息不对称的问题而存在的，客户端为了加快速度会缓存部分资源，但是下次请求时，客户端不知道这个资源有没有更新，服务端也不知道客户端缓存的是哪个版本，不知道该不该再返回资源，其实就是一个信息同步问题，`HTTP`缓存策略就是来解决这个问题的**。如果我们跳出这种纯粹的技术思维，我们会发现生活中这种信息同步问题也很常见。而我们解决这些问题的思路很多时候都是司空见惯了，如果从这个角度来说，这个问题就很好理解！”

于是我给他讲了一个我小时候租光碟看奥特曼的故事。

## 租光碟看奥特曼

事情是这样的，我小时候特别喜欢看动画片，尤其是奥特曼，但是那时候没有电脑啊，也没有网络。我只有一台DVD播放机，于是我会经常跑去租光碟的店租奥特曼。

### ETag

某天，我看完了《艾斯奥特曼》**第10集**，我还想继续看。于是我找到了光碟店的老板：“老板，**第10集**我看完了哦，你还有没有新的啊？”老板说：“有有有，刚出了**第11集**，你拿去吧！”

**上面这一个简单的交流过程其实就包含了一个`HTTP`的缓存技术，那就是`ETag`**！类比于网络请求，我其实就是客户端，光碟店就是服务端，我去租光碟就相当于发起一个请求。但是我去租光碟时，老板并不知道我看到哪集了，我们的信息是不同步的。所以我告诉了他一个标记(`Tag`)，在这里这个标记就是**第10集**，老板拿到这个标记，跟他自己库存的标记比较一下，发现他最新标记是**第11集**，于是知道有更新了，将**第11集**给了我。

### Last-Modified & If-Modified-Since

再来，我《艾斯奥特曼》看完了，我开始看《泰罗奥特曼》了。可是老板这次比较鸡贼，《泰罗奥特曼》没买正版的，是他自己翻录的，他翻录的时候自己也不知道是第几集，但是他聪明的在光盘上写上了翻录日期。于是我正在看的这盘也没啥封面，只光秃秃的写了一个**2000年12月1日**。当我这盘看完了，我又去找老板了：“老板，你这个**2000年12月1日**的我已经看完了，你还有没有新的啊？”这里的**2000年12月1日**其实就是标记了我手上副本的更新日期，这也对应了`HTTP`的一个缓存技术，**那就是`Last-Modified`和`If-Modified-Since`**。你可以理解为，老板给日期还取了一个名字，叫`Last-Modified`，所以光碟上完整文字是`Last-Modified:2000年12月1日`，而我去问的时候就这么问：“Do you have any updates (if) modified since 2000年12月1日？”。

### Expires和Max-Age

再来，我《泰罗奥特曼》也看完了，开始看《雷欧奥特曼》了。这《雷欧奥特曼》跟前面两个都不一样，我去租的时候老板就说了：“你小子别天天跑来问了！《雷欧奥特曼》我每周去进一次货，你每周一来拿就行！”**这句话也对应了一个`HTTP`缓存技术，那就是`Expires`和`Max-Age`**。我知道了下周一之前，我手上都是最新的，到了下周一就过期(`Expire`)了。所以“我手上的是最新的”这个说法有个生命周期，他的年龄是有限的，他的年龄等于下周一更新时间减去当前时间，这就是他的最大年龄(`Max-Age`)。

### Immutable

再来，我《雷欧奥特曼》也看完了，开始看《奈克斯特奥特曼》了。这《奈克斯特奥特曼》跟前面几个都不一样，我去租的时候老板说了：“小子，你这次运气好，这《奈克斯特奥特曼》已经出完了，你全部拿去吧，也不用天天跑来问了！”这句话对应的`HTTP`缓存技术是啥？**当然是Immutable**！`Immutable`就跟字面意思一样，不可变的！就像《奈克斯特奥特曼》一样，已经出完了，不用再去问更新了。

## 言归正传

扯蛋到这里结束，咱们言归正传！之所以举这么个例子，是为了说明`HTTP`缓存技术要解决的问题在生活中很常见，从这些常见的场景入手，理解起来更简单。下面我们正儿八经的来说说`HTTP`缓存技术：

### 两种机制

从上面的几个小例子可以看出，有时候为了知道是不是有更新，我必须去问老板，比如第一个例子里面：“老板，**第10集**我看完了哦，你还有没有新的啊？”。这种为了知道有没有更新，必须跟服务端沟通过才知道的，我们称之为**协商缓存**。还有些场景，我不去问就知道有没有更新，比如第三个例子，因为知道是周更的，当周一来之前，我都不会去问了，到了周一再去问，这种不用跟服务器协商直接用本地副本的叫做**强制缓存**。换成技术的话说就是，**强制缓存**不用发请求直接用本地缓存，**协商缓存**要发请求去问服务器有没有更新。下面我们详细来讲下这两种缓存：

### 协商缓存

前面第一个例子和第二个例子每次都需要向服务器端询问，所以是**协商缓存**。

#### ETag和If-None-Match

`ETag`是URL的`Entity Tag`，就是一个URL资源的标识符，类似于文件的`md5`，计算方式也类似，当服务器返回时，可以根据返回内容计算一个`hash`值或者就是一个数字版本号，类似于我们的`第10集`，具体返回什么值要看服务器的计算策略。然后将它**加到`response`的`header`里面**，可能长这样：

```javascript
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
```

客户端拿到后会将这个`ETag`和返回值一起存下来，等下次请求时，使用配套的`If-None-Match`，将这个**放到`request`的`header`里面**，可能长这样：

```javascript
If-None-Match: "33a64df551425fcc55e4d42a148795d9f25f89d4"
```

然后服务端拿到请求里面的`If-None-Match`跟当前版本的`ETag`比较下：

1. 如果是一样的话，直接返回`304`，语义为`Not Modified`，不返回内容(`body`)，只返回`header`，告诉浏览器直接用缓存。
2. 如果不一样的话，返回`200`和最新的内容

与`ETag`配套的还有一个不太常用的`request header `----`If-Match`，这个和前面`If-None-Match`的语义是相反的。前面`If-None-Match`的语义是**如果不匹配就下载**。而`If-Match`通常用于`post`或者`put`请求中，语义为**如果匹配才提交**，比如你在编辑一个商品，其他人也可能同时在编辑。当你提交编辑时，其他人可能已经先于你提交了，这时候服务端的`ETag`就已经变了，`If-Match`就不成立了，这时候服务端会给你返回`412`，也就是`Precondition Failed`，前提条件失败。如果`If-Match`成立，就正常返回`200`。

#### Last-Modified & If-Modified-Since

`Last-Modified`和`If-Modified-Since`也是配套使用的，类似于`ETag`和`If-None-Match`的关系。只不过`ETag`放的是一个版本号或者`hash`值，`Last-Modified`放的是资源的最后修改时间。`Last-Modified`是放到`response`的`header`里面的，可能长这样：

```javascript
Last-Modified: Wed, 21 Oct 2000 07:28:00 GMT 
```

而客户端浏览器在使用时，应该将配套的`If-Modified-Since`放到`request`的`header`里面，长这样：

```javascript
If-Modified-Since: Wed, 21 Oct 2000 07:28:00 GMT 
```

服务端拿到这个头后，会跟当前版本的修改时间进行比较：

1. 当前版本的修改时间比这个晚，也就是这个时间后又改过了，返回`200`和新的内容
2. 当前版本的修改时间和这个一样，也就是没有更新，返回`304`，不返回内容，客户端直接使用缓存

与`If-Modified-Since`对应的还有`If-Unmodified-Since`，`If-Modified-Since`可以理解为**有更新才下载**，那`If-Unmodified-Since`就是**没有更新才下载**。如果客户端传了`If-Unmodified-Since`，像这样：

```javascript
If-Unmodified-Since: Wed, 21 Oct 2000 07:28:00 GMT 
```

服务端拿到这个头后，也会跟当前版本的修改时间进行比较：

1. 如果这个时间后没有更新，服务器返回`200`，并返回内容。
2. 如果这个时间后有更新，其实就是这个`if`不成立，会返回错误代码`412`，语义为`Precondition Failed`

#### ETag和Last-Modified优先级

`ETag`和`Last-Modified`都是协商缓存，都需要服务器进行计算和比较，那如果这两个都存在，用哪个呢？**答案是`ETag`，`ETag`的优先级比`Last-Modified`高**。因为`Last-Modified`在设计上有个问题，那就是`Last-Modified`的精度只能到秒，如果一个资源频繁修改，在同一秒进行多次修改，你从`Last-Modified`上是看不出来区别的。但是`ETag`每次修改都会生成新的，所以他比`Last-Modified`精度高，更准确。但是`ETag`也不是完全没问题的，你的`ETag`如果设计为一个`hash`值，每次请求都要计算这个值，需要额外耗费服务器资源。具体使用哪一个，需要根据自己的项目情况来进行取舍。

### 强制缓存

上面扯蛋那里的第三个例子和第四个例子就是强制缓存，就是我知道在某个时间段完全不用去问服务端，直接去用缓存就行。这两个例子里面提到的`Expires`是一个单独的`header`，`max-age`和`immutable`同属于`Cache-Control`这个`header`。

#### Expires

`Expires`比较简单，就是服务器`response`的`header`带上这个字段：

```javascript
Expires: Wed, 21 Oct 2000 07:28:00 GMT
```

然后在这个时间前，客户端浏览器都不会再发起请求，而是直接用缓存资源。

#### Cache-Control

`Cache-Control`相对比较复杂，可设置属性也比较多，`max-age`只是其中一个属性，长这样：

```javascript
Cache-Control: max-age=20000
```

这表示当前资源在`20000秒`内都不用再请求了，直接使用缓存。

上面提到的`immutable`也是`Cache-Control`的一个属性，但是是个实验性质的，各个浏览器兼容并不好。设置了`Cache-control: immutable`表示这辈子都用缓存了，再请求是不可能的了。

其他常用属性还有：

`no-cache`：使用缓存前，强制要求把请求提交给服务器进行验证(协商缓存验证)。

`no-store`：不存储有关客户端请求或服务器响应的任何内容，即不使用任何缓存。

另外`Cache-Control`还有很多属性，大家可以参考[MDN的文档](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Cache-Control)。

#### Expires和Cache-Control的优先级

就一句话：如果在`Cache-Control`响应头设置了 `max-age` 或者 `s-maxage` 指令，那么 `Expires` 头会被忽略。

### 协商缓存和强制缓存优先级

这个其实很好理解，协商缓存需要发请求跟服务器协商，强制缓存如果生效，根本就不会发请求。所以这个优先级就是：**先判断强制缓存，如果强制缓存生效，直接使用缓存；如果强制缓存失效，再发请求跟服务器协商，看要不要使用缓存**。

## 总结

本文从生活中常见的场景入手，阐述了`HTTP`缓存机制其实是解决信息不同步的一种机制。这种信息不同步在生活中很常见，很多解决思路我们已经司空见惯，带着这种思维，我们可以很好的理解`HTTP`缓存机制。`HTTP`缓存机制要点如下：

1. `HTTP`缓存机制分为**强制缓存**和**协商缓存**两类。
2. **强制缓存**的意思就是不要问了(不发起请求)，直接用缓存吧。
3. **强制缓存**常见技术有`Expires`和`Cache-Control`。
4. `Expires`的值是一个时间，表示这个时间前缓存都有效，都不需要发起请求。
5. `Cache-Control`有很多属性值，常用属性`max-age`设置了缓存有效的时间长度，单位为`秒`，这个时间没到，都不用发起请求。
6. `immutable`也是`Cache-Control`的一个属性，表示这个资源这辈子都不用再请求了，但是他兼容性不好，`Cache-Control`其他属性可以参考[MDN的文档](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Cache-Control)。
7. `Cache-Control`的`max-age`优先级比`Expires`高。
8. **协商缓存**常见技术有`ETag`和`Last-Modified`。
9. `ETag`其实就是给资源算一个`hash`值或者版本号，对应的常用`request header`为`If-None-Match`。
10. `Last-Modified`其实就是加上资源修改的时间，对应的常用`request header`为`If-Modified-Since`，精度为`秒`。
11. `ETag`每次修改都会改变，而`Last-Modified`的精度只到`秒`，所以`ETag`更准确，优先级更高，但是需要计算，所以服务端开销更大。
12. **强制缓存**和**协商缓存**都存在的情况下，先判断**强制缓存**是否生效，如果生效，不用发起请求，直接用缓存。如果**强制缓存**不生效再发起请求判断**协商缓存**。

## 参考资料：

`ETag MDN`文档：[https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/ETag](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/ETag)

`Last-Modified MDN`文档：[https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Last-Modified](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Last-Modified)

`Expires MDN`文档：[https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Expires](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Expires)

`Cache-Control MDN`文档：[https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Cache-Control](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Cache-Control)

**文章的最后，感谢你花费宝贵的时间阅读本文，如果本文给了你一点点帮助或者启发，请不要吝啬你的赞和GitHub小星星，你的支持是作者持续创作的动力。**

**作者博文GitHub项目地址： [https://github.com/dennis-jiang/Front-End-Knowledges](https://github.com/dennis-jiang/Front-End-Knowledges)**

**作者掘金文章汇总：[https://juejin.im/post/5e3ffc85518825494e2772fd](https://juejin.im/post/5e3ffc85518825494e2772fd)**

**我也搞了个公众号[进击的大前端]，不打广告，不写水文，只发高质量原创，欢迎关注~**
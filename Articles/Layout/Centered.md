页面居中，各种元素居中是我们开发是很常见的情况，下面就来讨论下水平居中，垂直居中以及水平加垂直居中都有哪些常见的方案。我们的目标是对齐下面这两个div:

```html
<div class="parent">
  <div class="child">
    DEMO
  </div>
</div>
```

为了看清楚，我们给父级一个浅灰的背景，子级一个深灰的背景，开始时我们什么样式都不写，是下面这样的，子级会默认给父级撑满：

<img src="../../images/Layout/Centered/image-20200113162439424.png" alt="image-20200113162439424" style="zoom:33%;" />

## 水平居中

### text-align + inline-block

```css
.parent{
  /* text-align会对inline的子级生效，设置为center就会水平居中 */
	text-align: center;
}

.child{
  /* display设置为inline-block子级就不会撑满父级，而是自适应内容 */
	display: inline-block;
  /* text-align会继承，child的子级也会水平居中，如果我们想恢复默认，手动写为左对齐就行了 */
  text-align: left;
}
```

### table + margin

```css
.parent2 {
}

.child2 {
  /* display设置为table，如果不指定宽度，宽度就是自适应内容 */
	display: table;
  /* display如果是table，margin auto就可以生效 */
  /* 如果没有设置display为table，margin auto不能生效*/
	margin: 0 auto;
}

/* 如果知道子元素宽度，可以直接应用margin auto */
```

上面这个方法适合父级元素宽度不固定，子级元素宽度也不固定的情况。如果知道子级元素的宽度就很简单了，直接应用margin auto即可：

```css
.parent2 {
}

.child2 {
  width: 100px;
	margin: 0 auto;
}
```

### absoluate + transform

```css
.parent4 {
  /* 父级设置relative好让子级absolute相对于父级定位 */
	position: relative;
}

.child4 {
	position: absolute;
  /* left 50%会让子级在正中稍微靠右一点 */
	left: 50%;
  /* translateX百分比相对的是自身，因为前面靠右了，往左挪一点 */
  /* 挪的位置刚好是自身宽的一半*/
	transform: translateX(-50%);
}
```

### flex + justify-content

这应该是最简单的一种方式了，直接在父级定义justify-content center就行了。

```css
.parent5 {
	display: flex;
	justify-content: center;
}

.child5 {
}
```

### flex + margin

flex元素也可以支持margin auto, 所以可以这样写

```css
.parent51 {
	display: flex;
}

.child51 {
	margin: 0 auto;
}
```

## 垂直居中

### table-cell + vertical-align

vertical-align在table-cell里面生效，所以在给父级设置table-cell，然后vertical-align设置为middle就行了。

```css
.parent6 {
	display: table-cell;
	vertical-align: middle;
}

.child6 {
}
```

### absoluate + transform

与水平居中类似，父级设置为relative，子级设置为absolute，top设置为50%，这样会让位置稍微偏下一点，用transform往上挪一点。

```css
.parent7 {
	position: relative;
}

.child7 {
	position: absolute;
	top: 50%;
  /* translateY百分比也是相对于元素自身计算的 */
	transform: translateY(-50%);
}

```

### flex + align-items

这个应该是最简单的了，直接在父级设置flex和`align-items: center;`

```css
.parent8 {
	display: flex;
	align-items: center;
}

.child8 {
}
```

## 水平垂直居中

水平垂直居中直接将前面的水平居中和垂直居中结合起来就行了。

### text-align + inline-block + table-cell + vertical-align

```css
.parent9 {
	text-align: center;
	display: table-cell;
	vertical-align: middle;
}

.child9 {
	display: inline-block;
}
```

### absoluate + transform

前面水平居中，垂直居中都有absoluate + transform方案，结合起来就可以水平垂直居中了：

```css
.parent10 {
	position: relative;
}

.child10 {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}
```

### flex

又看到了我们最喜欢的flex了，做居中不要太简单！

```css
.parent11 {
	display: flex;
	justify-content: center;
	align-items: center;
}

.child11 {
}
```




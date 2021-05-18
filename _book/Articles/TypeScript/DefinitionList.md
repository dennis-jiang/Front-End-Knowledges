# TypeScript常用类型速查手册

`JavaScript`是一个天生的弱类型语言，即变量申明的时候不需要指定类型，不同类型的变量之间也可以相互赋值。如果你已经习惯了这种写法，用起来也是挺爽的，因为不需要特意关心变量类型，直接写就行。但是这样做也很容易导致BUG，而且这些BUG基本都是运行时才出现，因为没有类型，静态检查是查不出问题的，只有运行时报错，可能直接一来就是个线上BUG。

`TypeScript`就是为`JavaScript`加上了类型检查，可以用静态检查排查出类型相关的问题，从而避免了线上的BUG。现在`TypeScript`已经很流行了，我们的新项目也引入了他，但是我用的不是很熟练，经常遇到不知道怎么定义类型的问题。所以我整理了这一份速查手册，从基本类型到`interface`，泛型这些都有，分享给大家~

## 基本类型

`JavaScript`的数据类型主要分为值类型和引用类型两大类。

值类型有`string`, `number`, `boolean`, `undefined`, 另外ES6引入了`symbol`, ES2020引入了`bigint`。这些类型都可以直接作为TS类型使用：

```javascript
let a: string = 'hello';
let b: number = 1234;
let c: boolean = true;
let d: undefined = undefined;
let e: symbol = Symbol('world');
let f: bigint = 1234567123456123n;
let g: null = null;      // null也可以作为一个基本类型使用
```

另外一大类是引用类型，主要是`object`和`function`，当然你可以将他们直接作为TS类型使用，但是我们不推荐这么做，`object`最好使用接口或者类来定义，而`function`最好给出详细的参数定义。我们先来个最简单的写法，后面单独看详细的推荐做法：

```javascript
let a: object = {};
let b: Function = () => {};
```

一个变量可能有多个值的话，可以使用联合类型定义：

```javascript
let a: string | number | null = 123;
a = 'hello';
a = null;
```

上面这样申明一个变量是最常见的：

```javascript
let/const 名称: 类型 = 初始值;
```

但是如果你有了初始值也可以不写类型，比如：

```javascript
let a = 'str';    // TS自动推导a是string类型
a = 123;          // 报错：因为number不能赋值给string类型
```



## 数组

### 长度不确定的数组

1. 可以使用`T[]`这种形式：

   ```javascript
   let a: number[] = [1, 2, 3];
   ```

2. 也可以使用`Array<T>`这种形式：

   ```javascript
   let a: Array<number> = [1, 2, 3];
   ```

### 长度确定的数组或者元素类型不一样的数组

可以使用元组`[string, number]`这种形式：

```javascript
let a: [string, number] = ['hello', 123];
```

## 不确定的类型

有时候我们确实会遇到类型不确定的情况，这时候我们可能会用到`any`，`never`，`void`, `unknown`。他们的主要作用和区别是：

1. `any`：放弃TS的类型检查和保护，可以是任意值，跟普通JS一样，一般不推荐使用这个:

   ```javascript
   let a: any = ['hello', 123];
   a = 'hello';
   a = 123;
   ```

2. `never`：申明函数返回值，表示这个函数永远不会返回，一般用不到。因为一个函数你即使不写`return`也会默认返回`undefined`，永远不返回的是指无限循环之类，或者肯定抛出错误的：

   ```javascript
   let a: () => never = () => {
       throw new Error();
   }
   
   let b: () => never = () => {
       while (true) {}
   }
   ```

3. `void`: 表示函数没有返回值，其实就是默认返回`undefined`:

   ```javascript
   let a: () => void = () => {
       let b = 1;
       console.log(b);
   }
   
   let c: () => void = () => {
       let b = 1;
       console.log(b);
   
       return undefined;
   }
   ```

4. `unknown`：安全的未知类型，在可以使用`any`的地方，推荐换成`unknown`，会有类型保护。具体来说就是`unknown`只能被赋值，而不能赋值给别人，而且不能直接使用，要想使用必须自己先做动态类型检测。

   比如下面这样直接用会报错：

   ```javascript
   let a: (b: unknown) => void = (b) => {
       let c:number = b + 1;    // 报错：Object is of type 'unknown'.ts(2571)
   }
   ```

   但是如果你使用前先检测一下就没问题：

   ```javascript
   let a: (b: unknown) => void = (b) => {
       if(typeof b === 'number') {
           let c:number = b + 1;
       }
   }
   ```

   所以`unknown`说直白点就是**逼你在使用前先检测类型，自己保障类型安全**。

## 函数

一般函数的定义是这样的：

```javascript
function intro(name: string, age: number): string {
    return `My name is ${name}, I am ${age} years old`;
}
```

相较于普通的JS函数来说，只是给参数和返回值规定了类型而已。

函数是可以赋值给变量的，这个变量的类型应该是被赋值函数的签名，比如将上面的函数赋值给一个变量：

```javascript
const introFun: (name: string, age: number) => string = intro;
```

这里的`introFun`的签名就是

```javascript
(name: string, age: number) => string
```

这也是一个函数签名的标准格式：

```javascript
(参数1: 参数1类型, 参数2: 参数2类型 ...) => 返回值类型
```

这种函数变量我们也经常作为参数传递，比如另一个函数接收`introFun`作为参数，那可能就是这样的：

```javascript
function wrapper(place: string, introFun: (name: string, age: number) => string): string {
    console.log(`I am in ${place}`);

    return introFun('Dennis', 18);
}
```

这里的`introFun`的函数签名太长了，我们可以用`type`给他定义个别名:

```typescript
type TIntroFun = (name: string, age: number) => string;
```

然后就可以用`TIntroFun`替换那个长长的签名了：

```typescript
function wrapper(place: string, introFun: TIntroFun): string {
    console.log(`I am in ${place}`);

    return introFun('Dennis', 18);
}
```

### 可选参数

上面那样写的函数参数都是必须要传的，不传就报错，但是有时候我们有些参数是可选的，可选参数需要在参数名字后面加`?`:

```typescript
function intro(name: string, age?: number): string {
    if (!age) {
        return `My name is ${name}.`;
    }

    return `My name is ${name}, I am ${age} years old`;
}

intro('Dennis');    // age是可选的，可以不传
```

像`age?: number`这种可选参数，TS其实是自动联合了`undefined`类型，等价于`age: string | undefined`。

### 参数默认值

函数的参数是可以给默认值的，比如上面的`name`可以给一个默认值`小飞`：

```typescript
function intro(name: string = '小飞', age?: number): string {
    if (!age) {
        return `My name is ${name}.`;
    }

    return `My name is ${name}, I am ${age} years old`;
}
```

根据我们前面变量那里说的，一个变量有了初始值，其类型TS是可以自动推导的，所以`name`的类型可以省略，变成这样：

```typescript
function intro(name = '小飞', age?: number): string {
    if (!age) {
        return `My name is ${name}.`;
    }

    return `My name is ${name}, I am ${age} years old`;
}
```

**但是可选参数不能给默认值，给了就会报错**。

### 参数不确定

JS函数非常灵活，一个函数是可以支持不确定个数的参数的，比如这个加法函数：

```javascript
function add(...args) {
    return args.reduce((prev, item) => prev + item, 0);
}

console.log(add(1,2,3,4));   // 输出10
```

这个函数接收任意多个数字，返回他们的和，这种函数类型怎么定义呢？`args`其实是一个数组，按照数组类型给他就行了：

```typescript
function add(...args: number[]): number {
    return args.reduce((prev, item) => prev + item, 0);
}
```

那如果参数的前面几个是确定的，剩余参数不确定怎么写呢？结合我们前面的函数参数类型和`...args`就行了：

```typescript
function add(name: string, ...args: number[]): string {
    const total = args.reduce((prev, item) => prev + item, 0);

    return `${name}: ${total}`;
}

console.log(add('Dennis', 1, 2, 3, 4, 5));    // 输出：Dennis: 15
```




## [数组中重复的数字(简单)](https://leetcode-cn.com/problems/shu-zu-zhong-zhong-fu-de-shu-zi-lcof/)

链接：https://leetcode-cn.com/problems/shu-zu-zhong-zhong-fu-de-shu-zi-lcof/

### 题目

> 找出数组中重复的数字。
>
>
> 在一个长度为 n 的数组 nums 里的所有数字都在 0～n-1 的范围内。数组中某些数字是重复的，但不知道有几个数字重复了，也不知道每个数字重复了几次。请找出数组中任意一个重复的数字。
>

示例 1:

> ```
> 输入：
> [2, 3, 1, 0, 2, 5, 3]
> 输出：2 或 3 
> ```

### 解题思路

> 1. 这个题目级别为简单，是一个典型的哈希表。
> 2. 我们先用一个对象`obj`来存储哈希。
> 3. 然后对数组进行一次遍历，将每次遍历的数字放入这个对象，比如遍历到第一个数字为`2`，我们就将`2`放入这个对象，键和值都为`2`，这个对象变为`{2: 2}`。
> 4. 进行下一次遍历时，拿到数字`x`，先检查`obj.x`是不是数字类型，如果是数字类型，说明之前存在过了，直接返回，如果不是数字类型，将他假如这个哈希表`obj.x`。
> 5. 这样最差情况下，整个数字全部遍历完也拿到结果了，时间复杂度为$$O(n)$$，空间复杂度也是$$O(n)$$。

### 代码

```javascript
/**
 * @param {number[]} nums
 * @return {number}
 */
const findRepeatNumber = function(nums) {
    const obj = {};

    for(let i = 0; i < nums.length; i++) {
        if(typeof obj[nums[i]] === 'number') {
            return nums[i];
        } else {
            obj[nums[i]] = nums[i];
        }
    }
};
```

## [二维数组中的查找(简单)](https://leetcode-cn.com/problems/er-wei-shu-zu-zhong-de-cha-zhao-lcof/)

链接：https://leetcode-cn.com/problems/er-wei-shu-zu-zhong-de-cha-zhao-lcof/

### 题目

> 在一个 n * m 的二维数组中，每一行都按照从左到右递增的顺序排序，每一列都按照从上到下递增的顺序排序。请完成一个函数，输入这样的一个二维数组和一个整数，判断数组中是否含有该整数。
>

示例：

> 现有矩阵 matrix 如下：
>
> ```
> [
>   [1,   4,  7, 11, 15],
>   [2,   5,  8, 12, 19],
>   [3,   6,  9, 16, 22],
>   [10, 13, 14, 17, 24],
>   [18, 21, 23, 26, 30]
> ]
> ```
>
> 给定 target = `5`，返回 `true`。
>
> 给定 target = `20`，返回 `false`。

### 解题思路

> 1. 最简单的做法是挨个遍历这个二维数组，时间复杂度为$$O(m*n)$$
> 2. 最简单的往往不是最高效的，要做就做最高效的方法：
> 3. 从右上角开始遍历，如果这个数比target大，说明目标肯定在左边的列，换到左边列继续
> 4. 如果这个数比target小，说明他肯定在下面行，换到下一行继续
> 5. 如果一直搜索到左下角都没找到，返回false
> 6. 这个时间复杂度为$$O(m + n)$$。

### 代码

```javascript
var findNumberIn2DArray = function(matrix, target) {
    if(!matrix || !matrix.length || !matrix[0].length) {
        return false;
    }

    const height = matrix.length;
    const width = matrix[0].length;

    let i = 0;
    let j = width - 1;

    while(i <= (height -1) && j >= 0) {
        if(matrix[i][j] === target) {
            return true;
        } else if(matrix[i][j] > target) {
            j--;
        } else if(matrix[i][j] < target) {
            i++;
        }
    }

    return false;
};
```

## [ 替换空格(简单)](https://leetcode-cn.com/problems/ti-huan-kong-ge-lcof/)

### 题目

> 请实现一个函数，把字符串 `s` 中的每个空格替换成"%20"。

示例 1：

> ```
> 输入：s = "We are happy."
> 输出："We%20are%20happy."
> ```

### 解题思路

> 1. 这个题目太简单了，直接一个正则替换就行了
> 2. 还有个思路就是遍历，再建立一个字符串，如果源字符串是空格，就往新字符串放一个`%20`，否则放入原字符

### 代码

```javascript
// 正则
var replaceSpace = function(s) {
    return s.replace(/\s/g, '%20');
};

// 遍历
var replaceSpace = function(s) {
    let res = '';

    for(let i = 0; i < s.length; i ++){
        if(s[i] === ' '){
            res = res + '%20';
        } else {
            res = res + s[i];
        }
    }

    return res;
};
```

## [从尾到头打印链表(简单)](https://leetcode-cn.com/problems/cong-wei-dao-tou-da-yin-lian-biao-lcof/)

链接：https://leetcode-cn.com/problems/cong-wei-dao-tou-da-yin-lian-biao-lcof/

### 题目

> 输入一个链表的头节点，从尾到头反过来返回每个节点的值（用数组返回）。

示例 1

> ```
> 输入：head = [1,3,2]
> 输出：[2,3,1]
> ```

### 解题思路

> 1. 本题难度也是简单，是一个链表的遍历，但是需要从尾到头输出。
> 2. 最简单的方法是遍历一次，一次将值放入一个数组，然后使用数组的`reverse`输出，本文不使用这个API，而是给链表添加一个额外`prev`属性来实现，如下：
> 3. 每个节点有指向下个节点的指针`next`，我们可以顺着`next`找到最后一个节点
> 4. 在找最后节点的过程中，给每个节点添加一个属性`prev`，指向上一个节点
> 5. 找到最后一个节点的同时，也给每个节点加上了`prev`属性
> 6. 最后从最后一个节点开始顺着`prev`输出值
> 7. 总共遍历两次，时间复杂度为$$O(n)$$。

### 代码

```javascript
/**
 * Definition for singly-linked list.
 * function ListNode(val) {
 *     this.val = val;
 *     this.next = null;
 * }
 */
/**
 * @param {ListNode} head
 * @return {number[]}
 */
var reversePrint = function(head) {
    if(!head) return [];

  	// 找最后一个节点，同时添加prev属性
    head.prev = null;
    let currentNode = head;
    let lastNode;
    while(currentNode) {
        if(currentNode.next) {
            currentNode.next.prev = currentNode;
        }

        if(!currentNode.next) {
           lastNode =  currentNode;
        }

        currentNode = currentNode.next;
    }

  	// 最后顺着prev属性输出值
    const res = [];
    while(lastNode) {
        res.push(lastNode.val);

        lastNode = lastNode.prev;
    }

    return res;
};
```

## [重建二叉树(中等)](https://leetcode-cn.com/problems/zhong-jian-er-cha-shu-lcof/)

链接：https://leetcode-cn.com/problems/zhong-jian-er-cha-shu-lcof/

### 题目

> 输入某二叉树的前序遍历和中序遍历的结果，请重建该二叉树。假设输入的前序遍历和中序遍历的结果中都不含重复的数字。

例如，给出

> ```
> 前序遍历 preorder = [3,9,20,15,7]
> 中序遍历 inorder = [9,3,15,20,7]
> ```

返回如下的二叉树：

> ```
>     3
>    / \
>   9  20
>     /  \
>    15   7
> ```

### 解题思路

> 1. 本题难度为中等，有一定的难度，要解此题，必须先要知道二叉树的前序，中序，后序遍历都是什么意思
> 2. 前序遍历：按照根节点，左子树，右子树的顺序遍历
> 3. 中序遍历：按照左子树，根节点，右子树的顺序遍历
> 4. 后序遍历：按照左子树，右子树，根节点的顺序遍历
> 5. 所谓前序，中序，后序指的是遍历时根节点的位置，前序根节点在最前面，中序就在中间，后序就在后面
> 6. 这个题目已知前序遍历顺序，前序遍历第一个数字肯定是根节点
> 7. 已知根节点，去中序遍历中找到这个根节点，这个节点左边的全部位于左子树，而且是左子树的中序遍历结果，右边的全部位于右子树，而且是右子树的中序遍历结果，还可以知道左子树的节点的个数m，右子树的节点个数n
> 8. 前序序列中往后数m个节点，肯定是左子树的前序遍历结果，再往后n个节点肯定是右子树的前序遍历结果
> 9. 从而我们分别知道了左子树和右子树的前序和中序遍历结果，继续递归这个算法就行
> 10. 递归结束条件是当start等于end时，说明到了叶子节点，直接返回节点；如果start大于end说明越界了，返回null。
> 11. 每次递归的时候都要查找根节点在中序遍历中的位置，为了加快速度，我们可以用一个对象把它存下来。
> 12. 虽然是递归，但是其实采用了分治思想，每个数据只遍历了一次，时间复杂度为$$O(n)$$。

### 代码

```javascript
/**
 * Definition for a binary tree node.
 * function TreeNode(val) {
 *     this.val = val;
 *     this.left = this.right = null;
 * }
 */
/**
 * @param {number[]} preorder
 * @param {number[]} inorder
 * @return {TreeNode}
 */
var buildTree = function(preorder, inorder) {
    if(!preorder || !preorder.length) {
        return null;
    }

    let map = {};
    for(let i = 0; i < inorder.length; i++) {
        map[inorder[i]] = i;
    }

    function doBuild(preorder, preorderStart, preorderEnd, inorder, inorderStart, inorderEnd) {
        if(preorderStart > preorderEnd) {
            return null;
        }

        let rootVal = preorder[preorderStart];
        let root = new TreeNode(rootVal);

        let inIndex = map[rootVal];
        let leftNum = inIndex - inorderStart;
        let rightNum = inorderEnd - inIndex;

        let leftPreorderStart = preorderStart + 1;
        let leftPreorderEnd = preorderStart + leftNum;
        let rightPreorderStart = leftPreorderEnd + 1;
        let rightPreOrderEnd = preorderEnd;

        let leftInorderStart = inorderStart;
        let leftInorderEnd = inIndex - 1;
        let rightInorderStart = inIndex + 1;
        let rightInorderEnd = inorderEnd;

        if(preorderStart === preorderEnd) {
            return root;
        } else {
            let leftRoot = doBuild(preorder, leftPreorderStart, leftPreorderEnd, inorder, leftInorderStart, leftPreorderEnd);
            let rightRoot = doBuild(preorder, rightPreorderStart, rightPreOrderEnd, inorder, rightInorderStart, rightInorderEnd);
            root.left = leftRoot;
            root.right = rightRoot;
            return root;
        }
    }

    let arrLength = preorder.length;

    return doBuild(preorder, 0, arrLength - 1, inorder, 0, arrLength - 1);
};
```

## [把数字翻译成字符串(中等)](https://leetcode-cn.com/problems/ba-shu-zi-fan-yi-cheng-zi-fu-chuan-lcof/)

链接：https://leetcode-cn.com/problems/ba-shu-zi-fan-yi-cheng-zi-fu-chuan-lcof/

### 题目

> 给定一个数字，我们按照如下规则把它翻译为字符串：0 翻译成 “a” ，1 翻译成 “b”，……，11 翻译成 “l”，……，25 翻译成 “z”。一个数字可能有多个翻译。请编程实现一个函数，用来计算一个数字有多少种不同的翻译方法。
>

示例 1:

> ```
> 输入: 12258
> 输出: 5
> 解释: 12258有5种不同的翻译，分别是"bccfi", "bwfi", "bczi", "mcfi"和"mzi"
> ```

### 解题思路

> 1. 本题难度为中等，可以蛮干，也可以用一点技巧
>
> 2. 本题看似要翻译这个字符串，其实要做的是拆分这个数字，对于`12258`而言，可以一个一个数字拆开，也可以两个两个拆开，拆为`12`，`22`，`25`，`58`，但是两位拆开，拆完后的数字必须大于等于10，小于等于25。
>
> 3. 知道真正要干什么了，我们可以直接暴力求解，其实就相当于把一个有5节的竹子砍断，每两个数字之间都可以下刀，总共可以下刀的位置有4个，每个位置可以选择下刀或者不下刀两种情况。所以总共可以砍出的方案是$$2^4$$，16种，然后看这16种有几种满足情况就行。这个暴力解法虽然理论上可以算出来，但是复杂度是指数级，数字稍大就凉凉。
>
> 4. 为了降低复杂度，我们可以采用动态规划来计算，我们假设长度为i的数字的最终方案是$$f(i)$$种，我们考虑最后一位，假如我们最后一位单独拆开，那还剩下`i-1`位，这`i-1`位的方案$$f(i-1)$$其实和$$f(i)$$相等，因为最后一位只有一种拆法。
>
> 5. 我们再考虑下最后两位一起拆，这时候的情况要看下这两位是不是合法的，假设这两位组成的数字是`x`，如果$$10 <= x <= 25$$，就是合法的，否则不合法，如果合法，最后两种一起拆的情况就是$$f(i-2)$$。
>
> 6. 所以最后我们的方程为：
>    $$
>    f(i) = 
>    	\begin{cases}
>    		f(i-1), & x不合法 \\
>    		f(i-1) + f(i-2), & x合法
>    	\end{cases}
>    $$
>    这个方程是不是看着非常像斐波拉契数列，我们可以直接用递归来求解这个方程，但是复杂度也是指数级，所以我们还是要用动态规划。[如果你对动态规划不了解，可以看看我这篇文章。](https://juejin.im/post/5e4b472251882549507b015f)
>
> 7. 需要注意的是边界条件$$f(0) = 1, f(1) = 1$$。因为1位数字的时候，显然只有一种方案，但是当两位数字是合法数字的时候，有两种方案，即$$f(2) = 2$$，而且$$f(1) = 1$$，反推出$$f(0) = 1$$。

### 代码

```javascript
/**
 * @param {number} num
 * @return {number}
 */
var translateNum = function(num) {
    let res = [1, 1];
    let numStr = `${num}`;
    let length = numStr.length;
    for(let i = 2; i <= numStr.length; i++) {
        let last2Num = parseInt(numStr[i - 2] + numStr[i-1]);

        if(last2Num >= 10 && last2Num <= 25) {
            res[i] = res[i - 1] + res[i - 2];
        } else {
            res[i] = res[i - 1];
        }
    }

    return res[length];
};
```

上述代码的时间复杂度为$$O(n)$$，空间复杂度也是$$O(n)$$。

## [用两个栈实现队列(简单)](https://leetcode-cn.com/problems/yong-liang-ge-zhan-shi-xian-dui-lie-lcof/)

链接：https://leetcode-cn.com/problems/yong-liang-ge-zhan-shi-xian-dui-lie-lcof/

### 题目

> 用两个栈实现一个队列。队列的声明如下，请实现它的两个函数 appendTail 和 deleteHead ，分别完成在队列尾部插入整数和在队列头部删除整数的功能。(若队列中没有元素，deleteHead 操作返回 -1 )
>

示例 1：

> ```
> 输入：
> ["CQueue","appendTail","deleteHead","deleteHead"]
> [[],[3],[],[]]
> 输出：[null,null,3,-1]
> ```

示例 2：

> ```
> 输入：
> ["CQueue","deleteHead","appendTail","appendTail","deleteHead","deleteHead"]
> [[],[],[5],[2],[],[]]
> 输出：[null,-1,null,null,5,2]
> ```

### 解题思路

> 1. 这个题目难度是简单，需要用两个栈模拟队列
> 2. 这个题目其实不适合JS，因为JS没有栈和队列这种数据结构，我们只能用数组模拟
> 3. 栈的结构是先进先出，只能操作栈顶，我们用数组模拟的时候可以将数组第一个元素看为栈顶，也就是只能操作第一个元素，也就是只能使用`shift`和`unshift`函数
> 4. 两个数组(栈)分别是`arr1`和`arr2`，`arr1`主要用来记录元素，`arr2`用来辅助操作
> 5. 每次插入元素都往`arr1`里面`unshift`，也就是说`arr1`第一个元素是最后插入的元素，`arr1`里面元素的顺序是`后进入->先进入`
> 6. 每次删除时，需要删除最先进入的元素，如果使用`arr1.pop`直接就实现了，但是我们是栈，只能操作第一个元素，`pop`不能用。这时候我们需要借助`arr2`了，我们将`arr1`挨个`shift`，然后每个`unshift`进`arr2`，这样`arr2`里面的顺序就是`先进入->后进入`了，刚好跟`arr1`顺序相反，使用`arr2.shift`拿出第一个就行了。
> 7. 后面再执行删除时，可以先看看`arr2`里面有没有元素，如果有，说明有准备好的倒序数据，直接`arr2.shift`。如果`arr2`没有元素，再看`arr1`有没有元素，如果有，挨个`unshift`进`arr2`，然后`arr2.shift`。最后如果`arr1`也没有元素，说明两个数组都是空的，返回-1。

### 代码

```javascript
var CQueue = function() {
    this.arr1 = [];
    this.arr2 = [];
};

/** 
 * @param {number} value
 * @return {void}
 */
CQueue.prototype.appendTail = function(value) {
    this.arr1.unshift(value);
};

/**
 * @return {number}
 */
CQueue.prototype.deleteHead = function() {
    let length1 = this.arr1.length;
    let length2 = this.arr2.length;

    if(length2) {
        return this.arr2.shift();
    } else if(length1) {
        for(let i = 0; i < length1; i++) {
            this.arr2.unshift(this.arr1.shift())
        }

        return this.arr2.shift();
    } else {
        return -1;
    }
};

/**
 * Your CQueue object will be instantiated and called as such:
 * var obj = new CQueue()
 * obj.appendTail(value)
 * var param_2 = obj.deleteHead()
 */
```

上述代码插入元素的时间复杂度是$$O(1)$$，空间复杂度也是$$O(1)$$；删除元素时间复杂度是$$O(n)$$，空间复杂度也是$$O(n)$$。

## [ 斐波那契数列(简单)](https://leetcode-cn.com/problems/fei-bo-na-qi-shu-lie-lcof/)

链接：https://leetcode-cn.com/problems/fei-bo-na-qi-shu-lie-lcof/

### 题目

> 写一个函数，输入 n ，求斐波那契（Fibonacci）数列的第 n 项。斐波那契数列的定义如下：
>
> ```
> F(0) = 0,   F(1) = 1
> F(N) = F(N - 1) + F(N - 2), 其中 N > 1.
> 斐波那契数列由 0 和 1 开始，之后的斐波那契数就是由之前的两数相加而得出。
> ```
>
> 答案需要取模 1e9+7（1000000007），如计算初始结果为：1000000008，请返回 1。
>

**示例 1：**

> ```
> 输入：n = 2
> 输出：1
> ```

**示例 2：**

> ```
> 输入：n = 5
> 输出：5
> ```

### 解题思路

> 1. 这个题目难度是简单，是一个很经典的问题
> 2. 题目中已经给出了递推式，可以直接用递归，但是时间复杂度是指数级，`F(100)`估计都得跑几天
> 3. 所以我们采用动态规划求解，递推式已经知道了，动态规划直接写就行
> 4. 注意不要忘了给结果取余，不然数字太大会溢出的

### 代码

```javascript
/**
 * @param {number} n
 * @return {number}
 */
var fib = function(n) {
    let res = [0, 1];

    for(let i = 2; i <= n; i++) {
        res[i] = (res[i - 1] + res[i - 2]) % 1000000007;
    }

    return res[n];
};
```

## [青蛙跳台阶问题(简单)](https://leetcode-cn.com/problems/qing-wa-tiao-tai-jie-wen-ti-lcof/)

链接：https://leetcode-cn.com/problems/qing-wa-tiao-tai-jie-wen-ti-lcof/

### 题目

> 一只青蛙一次可以跳上1级台阶，也可以跳上2级台阶。求该青蛙跳上一个 n 级的台阶总共有多少种跳法。
>
> 答案需要取模 1e9+7（1000000007），如计算初始结果为：1000000008，请返回 1。
>

**示例 1：**

```
输入：n = 2
输出：2
```

**示例 2：**

```
输入：n = 7
输出：21
```

### 解题思路

> 1. 本题难度为简单，其实就是斐波拉契数列的翻版
>
> 2. 我们假设青蛙跳n级台阶的方式为`F(n)`种，我们考虑最后一次的跳法。如果两级台阶一起跳，则跳法为`F(n-2)`种，如果只跳一级台阶，则跳法为`F(n-1)`种。这两种方法青蛙都可以选择，所以总共的次数为：
>    $$
>    F(n) = F(n-1) + F(n-2)
>    $$
>    这不就是斐波拉契数列吗？但是需要注意，这里的$$F(0) = 1$$，因为两级台阶是跳法有两种，一级时只有一种，可以反算出$$F(0) = 1$$。

### 代码

```javascript
// 几乎跟斐波拉契数列一样，只是F(0)不一样
/**
 * @param {number} n
 * @return {number}
 */
var numWays = function(n) {
    let res = [1, 1];

    for(let i = 2; i <= n; i++) {
        res[i] = (res[i - 1] + res[i - 2]) % 1000000007;
    }

    return res[n];
};
```


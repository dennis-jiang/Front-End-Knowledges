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

> 1. 最简单的做法是挨个遍历这个数组，时间复杂度为$$O(m*n)$$
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

> 
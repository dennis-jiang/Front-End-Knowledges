排序是很常见也很经典的问题，下面讲几种排序算法：

## 冒泡排序

冒泡排序是最好理解的一种算法，以升序排序为例，即最小的在前面，对数组进行一次遍历，如果相邻的两个数前面的比后面的大，则交换他们的位置，第一次遍历会将最大的数字排到最后去，第二次遍历会将第二大的数字排到倒数第二的位置。。。以此类推，遍历n-1遍整个数组就有序了。详细解说参考https://www.runoob.com/w3cnote/bubble-sort.html:

![bubbleSort](../../images/DataStructureAndAlgorithm/Sort/bubbleSort.gif)

下面我们自己来实现一遍代码：

```javascript
const array = [1, 3, 2, 6, 4, 5, 9, 8, 7];

const sort = (arr) => {
  let result = [...arr];
  let temp;
  for(let i = 0; i < result.length; i++){
    for(let j = i + 1; j < result.length; j++){
      if(result[i] > result[j]){
        temp = result[i];
        result[i] = result[j];
        result[j] = temp;
      }
    }
  }
  
  return result;
}

const newArr = sort(array);
console.log(newArr); // [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

## 插入排序

会打扑克的同学应该很熟悉这个排序法，每次摸牌的时候都去手里面已经排好序的牌里面比较下，找到它的位置，插入进去。这个查找可以使用二分查找，所以更快。具体分析看这里：https://www.runoob.com/w3cnote/insertion-sort.html

![insertionSort](../../images/DataStructureAndAlgorithm/Sort/insertionSort.gif)

```javascript
const array = [1, 3, 2, 6, 4, 5, 9, 8, 7];

const sort = (arr) => {
  let result = [...arr];
  let temp;
  for(let i = 0; i < result.length; i++){
    let j = i;
    while(result[j - 1] > result[j] && j>=0){
      temp = result[j - 1];
      result[j - 1] = result[j];
      result[j] = temp;
      j--;
    }
  }
  
  return result;
}

const newArr = sort(array);
console.log(newArr); // [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

```javascript
// 二分查找版
const array = [1, 3, 2, 6, 4, 5, 9, 8, 7];

const sort = (arr) => {
  let result = [...arr];
  let i = 0;
  let length = result.length;
  for(i; i < length; i++) {
    let left = 0;
    let right = i - 1;
    let current = result[i];
    
    // 找目标位置, 最终的left就是目标位置
    while(left <= right) {
      let middle = parseInt((left + right) / 2);
      if(current < result[middle]){
        right = middle - 1
      } else {
        left = middle + 1;
      }
    }
    
    // 将目标位置后面的元素全部后移一个，位置让出来
    for(let j = i - 1; j >= left; j--){
      result[j+1] = result[j];
    }
    
    // 最后将当前值插入到正确位置
    result[left] = current;
  }
  
  return result;
}

const newArr = sort(array);
console.log(newArr); // [1, 2, 3, 4, 5, 6, 7, 8, 9]
```



未完待续。。。
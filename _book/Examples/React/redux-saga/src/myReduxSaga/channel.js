export function multicastChannel() {
  const currentTakers = [];     // 一个变量存储我们所有注册的事件和回调

  // 保存事件和回调的函数
  // Redux-Saga里面take接收回调和匹配方法matcher两个参数
  // 事实上take到的事件名称也被封装到了matcher里面
  function take(cb, matcher) {
    cb['MATCH'] = matcher;
    currentTakers.push(cb);
  }

  function put(input) {
    const takers = currentTakers;

    for (let i = 0, len = takers.length; i < len; i++) {
      const taker = takers[i]

      // 这里的'MATCH'是上面take塞进来的匹配方法
      // 如果匹配上了就将回调拿出来执行
      if (taker['MATCH'](input)) {
        taker(input);
      }
    }
  }

  return {
    take,
    put
  }
}
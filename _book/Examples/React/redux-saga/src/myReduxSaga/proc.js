import effectRunnerMap from './effectRunnerMap';

export default function proc(env, iterator) {
  // 调用next启动迭代器执行
  next();

  // next函数也不复杂
  // 就是执行iterator
  function next(arg, isErr) {
    let result;
    if (isErr) {
      result = iterator.throw(arg);
    } else {
      result = iterator.next(arg);
    }

    // 如果他没结束，就继续next
    // digestEffect是处理当前步骤返回值的函数
    // 继续执行的next也由他来调用
    if (!result.done) {
      digestEffect(result.value, next)
    }
  }

  // runEffect就只是获取对应type的处理器，然后拿来处理当前effect
  function runEffect(effect, currCb) {
    if (effect && effect.IO) {
      const effectRunner = effectRunnerMap[effect.type]
      effectRunner(env, effect.payload, currCb);
    } else {
      currCb();
    }
  }

  function digestEffect(effect, cb) {    // 这个cb其实就是前面传进来的next
    // 这个变量是用来解决竞争问题的
    let effectSettled;
    function currCb(res, isErr) {
      // 如果已经运行过了，直接return
      if (effectSettled) {
        return
      }

      effectSettled = true;

      cb(res, isErr);
    }

    runEffect(effect, currCb);
  }
}
// 创建和管理listeners的方法
function createEvents() {
  let handlers = [];

  return {
    push(fn) {
      handlers.push(fn);
      return function() {
        handlers = handlers.filter(handler => handler !== fn);
      };
    },
    call(arg) {
      handlers.forEach(fn => fn && fn(arg));
    }
  }
}

function createBrowserHistory() {
  const listeners = createEvents();

  // 路由变化时的回调
  const handlePop = function() {
    listeners.call();     // 路由变化时执行回调
  }

  // 监听路由变化，BrowserHistory监听的事件是popstate
  window.addEventListener('popstate', handlePop);

  // 返回的history上有个listen方法
  const history = {
    listen(listener) {
      return listeners.push(listener);
    },
    push(url) {
      const history = window.history;
      history.pushState(null, '', url);
    }
  }

  return history;
}

export default createBrowserHistory;
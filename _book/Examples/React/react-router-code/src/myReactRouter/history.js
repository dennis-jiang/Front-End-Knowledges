// 创建和管理listeners的方法
function createEvents() {
  let handlers = [];

  return {
    push(fn) {
      handlers.push(fn);
      return function () {
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
  let location = {
    pathname: '/',
  };

  // 路由变化时的回调
  const handlePop = function () {
    const currentLocation = {
      pathname: window.location.pathname
    }
    listeners.call(currentLocation);     // 路由变化时执行回调
  }

  // 监听popstate事件
  // 注意pushState和replaceState并不会触发popstate
  // 但是浏览器的前进后退会触发popstate
  // 我们这里监听这个事件是为了处理浏览器的前进后退
  window.addEventListener('popstate', handlePop);

  // 返回的history上有个listen方法
  const history = {
    listen(listener) {
      return listeners.push(listener);
    },
    push(url) {
      const history = window.history;
      // 这里pushState并不会触发popstate
      // 但是我们仍然要这样做，是为了保持state栈的一致性
      history.pushState(null, '', url);

      // 由于push并不触发popstate，我们需要手动调用回调函数
      location = { pathname: url };
      listeners.call(location);
    },
    location
  }

  return history;
}

export default createBrowserHistory;
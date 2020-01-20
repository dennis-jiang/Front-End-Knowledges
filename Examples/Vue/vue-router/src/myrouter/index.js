/* eslint-disable no-console */
class HistoryRoute {
  constructor() {
    this.current = null;
  }
}

class vueRouter {
  constructor(options) {
    this.mode = options.mode || 'hash';
    this.routes = options.routes || [];
    this.history = new HistoryRoute();

    // 将数组结构的routes转化成一个更好查找的对象
    this.routesMap = this.mapRoutes(this.routes);
    this.init();
  }

  // 加载事件监听
  init() {
    if(this.mode === 'hash'){
      // 如果url没有hash，给一个默认的根目录hash
      location.hash ? '' : location.hash = '/';
      window.addEventListener('load', () => {
        // 页面加载的时候初始化，存储hash值到history的current上，并且去掉开头的#
        this.history.current = location.hash.slice('1');
      });
      window.addEventListener('hashchange', () => {
        // hash改变的时候更新history的current
        this.history.current = location.hash.slice('1');
      })
    } else {
      // else处理history模式
      // 如果url没有pathname，给一个默认的根目录pathname
      location.pathname ? '' : location.pathname = '/';
      window.addEventListener('load', () => {
        // 页面加载的时候初始化，存储pathname值到history的current上
        this.history.current = location.pathname;
      });
      window.addEventListener('popstate', () => {
        // pathname改变的时候更新history的current
        this.history.current = location.pathname;
      })
    }
  }

  /*
  将 [{path: '/', component: Hello}]
  转化为 {'/': Hello}
  */
  mapRoutes(routes) {
    return routes.reduce((res, current) => {
      res[current.path] = current.component;
      return res;
    }, {})
  }
}

// 添加install属性，用来执行插件
vueRouter.install = function(vue) {
  vue.mixin({
    beforeCreate() {
      // 获取new Vue时传入的参数
      if(this.$options && this.$options.router) {
        this._root = this;
        this._router = this.$options.router;

        // 监听current, defineReactive(obj, key, val)不传第三个参数，第三个参数默认是obj[key]
        // 第三个参数传了也会被监听，效果相当于，第一个参数的子级
        vue.util.defineReactive(this, 'current', this._router.history);
      } else {
        // 如果不是根组件，就往上找
        this._root = this.$parent._root;
      }

      // 暴露一个只读的$router
      Object.defineProperty(this, '$router', {
        get() {
          return this._root._router;
        }
      })
    }
  });

  // 新建一个router-view组件，这个组件根据current不同会render不同的组件
  // 最终实现路由功能
  vue.component('router-view', {
    render(h){
      const current = this._self._root._router.history.current;
      const routesMap = this._self._root._router.routesMap;
      const component = routesMap[current];

      return h(component);
    }
  })
}

export default vueRouter;
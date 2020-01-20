/* eslint-disable no-console */
import Vue from 'vue'
import App from './App.vue'
//import vueRouter from 'vue-router'
import vueRouter from './myrouter';
import routes from './routes'

/* 插件示例
function pluginA() {
  console.log(1);
}

pluginA.install = function(vue) {
	vue.mixin({
    data() {
      return {globalData: 'this is mixin data'}
    },
    // 混入生命周期
    created() {
      console.log(this);
    }
  })
}

// pluginA如果没有install属性，执行本身，输出1
// 如果有install属性，执行install属性对应的方法，输出install
Vue.use(pluginA); 
*/

Vue.use(vueRouter)

Vue.config.productionTip = false

const router = new vueRouter({
  routes, 
  mode:'history'
})

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')

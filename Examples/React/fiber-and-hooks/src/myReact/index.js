function createElement(type, props, ...children) {
  // 核心逻辑不复杂，将参数都塞到一个对象上返回就行
  // children也要放到props里面去，这样我们在组件里面就能通过this.props.children拿到子元素
  return {
    type,
    props: {
      ...props,
      children
    }
  }
}

function createDom(vDom) {
  let dom;
  // 检查当前节点是文本还是对象
  if(typeof vDom === 'string') {
    dom = document.createTextNode(vDom)
  } else {
    dom = document.createElement(vDom.type);
  }

  // 将vDom上除了children外的属性都挂载到真正的DOM上去
  if(vDom.props) {
    Object.keys(vDom.props)
      .filter(key => key != 'children')
      .forEach(item => {
        dom[item] = vDom.props[item];
      })
  }

  return dom;
}

// 任务调度
let currentTask = null;
// workLoop用来调度任务
function workLoop(deadline) {
  while(currentTask && deadline.timeRemaining() > 1) {
    // 这个while循环会在任务执行完或者时间到了的时候结束
    currentTask = peekTask(currentTask);
  }

  // 如果任务还没完，但是时间到了，我们需要继续注册requestIdleCallback
  requestIdleCallback(workLoop);
}

// peekTask用来获取下个任务，参数是我们的fiber
function peekTask(fiber) {

}
requestIdleCallback(workLoop);

function render(vDom, container) {
  // let dom;
  // // 检查当前节点是文本还是对象
  // if(typeof vDom === 'string') {
  //   dom = document.createTextNode(vDom)
  // } else {
  //   dom = document.createElement(vDom.type);
  // }

  // // 将vDom上除了children外的属性都挂载到真正的DOM上去
  // if(vDom.props) {
  //   Object.keys(vDom.props)
  //     .filter(key => key != 'children')
  //     .forEach(item => {
  //       dom[item] = vDom.props[item];
  //     })
  // }
  
  // // 如果还有子元素，递归调用
  // if(vDom.props && vDom.props.children && vDom.props.children.length) {
  //   vDom.props.children.forEach(child => render(child, dom));
  // }

  // container.appendChild(dom);

  currentTask = {
    dom: container,
    props: {
      child: vDom
    }
  }
}

export default {
  createElement,
  render
}
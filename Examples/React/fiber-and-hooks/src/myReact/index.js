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

// 创建DOM的操作
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
      .filter(key => key !== 'children')
      .forEach(item => {
        dom[item] = vDom.props[item];
      })
  }

  return dom;
}

// 更新DOM的操作
function updateDom(dom, prevProps, nextProps) {
  // 1. 过滤children属性
  // 2. 老的存在，新的没了，取消
  // 3. 新的存在，老的没有，新增
  Object.keys(prevProps)
    .filter(name => name !== 'children')
    .filter(name => !(name in nextProps))
    .forEach(name => dom[name] = '');
  
  Object.keys(nextProps)
    .filter(name => name !== 'children')
    .forEach(name => dom[name] = nextProps[name]);  
}

// 统一操作DOM
function commitRoot() {
  deletions.forEach(commitRootImpl);     // 执行真正的节点删除
  commitRootImpl(workInProgressRoot.child);    // 开启递归
  currentRoot = workInProgressRoot;    // 记录一下currentRoot
  workInProgressRoot = null;     // 操作完后将workInProgressRoot重置
}

function commitRootImpl(fiber) {
  if(!fiber) {
    return;
  }

  const parentDom = fiber.return.dom;
  if(fiber.effectTag === 'REPLACEMENT' && fiber.dom) {
    parentDom.appendChild(fiber.dom);
  } else if(fiber.effectTag === 'DELETION') {
    parentDom.removeChild(fiber.dom);
  } else if(fiber.effectTag === 'UPDATE') {
    // 更新DOM属性
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  }

  // 递归操作子元素和兄弟元素
  commitRootImpl(fiber.child);
  commitRootImpl(fiber.sibling);
}

// 任务调度
let nextUnitOfWork = null;
let workInProgressRoot = null;
let currentRoot = null;
let deletions = null;
// workLoop用来调度任务
function workLoop(deadline) {
  while(nextUnitOfWork && deadline.timeRemaining() > 1) {
    // 这个while循环会在任务执行完或者时间到了的时候结束
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }

  // 任务做完后统一渲染
  if(!nextUnitOfWork && workInProgressRoot) {
    commitRoot();
  }

  // 如果任务还没完，但是时间到了，我们需要继续注册requestIdleCallback
  requestIdleCallback(workLoop);
}

// 
function reconcileChildren(workInProgressFiber, elements) {
  // 构建fiber结构
  let oldFiber = workInProgressFiber.alternate && workInProgressFiber.alternate.child;  // 获取上次的fiber树
  let prevSibling = null;
  let index = 0;
  if(elements && elements.length) {
    // for(let i = 0; i < elements.length; i++) {
    //   const element = elements[i];
    //   const newFiber = {
    //     type: element.type,
    //     props: element.props,
    //     return: workInProgressFiber,
    //     dom: null
    //   }

    //   // 父级的child指向第一个子元素
    //   if(i === 0) {
    //     workInProgressFiber.child = newFiber;
    //   } else {
    //     // 每个子元素拥有指向下一个子元素的指针
    //     prevSibling.sibling = newFiber;
    //   }

    //   prevSibling = newFiber;
    // }

    while(index < elements.length && oldFiber) {
      let element = elements[index];
      let newFiber = null;

      // 对比oldFiber和当前element
      const sameType = oldFiber && element && oldFiber.type === element.type;  //检测类型是不是一样
      // 先比较元素类型
      if(sameType) {
        // 如果类型一样，复用节点，更新props
        newFiber = {
          type: oldFiber.type,
          props: element.props,
          dom: oldFiber.dom,
          return: workInProgressFiber,
          alternate: oldFiber,          // 记录下上次状态
          effectTag: 'UPDATE'           // 添加一个操作标记
        }
      } else if(!sameType && element) {
        // 如果类型不一样，有新的节点，创建新节点替换老节点
        newFiber = {
          type: element.type,
          props: element.props,
          dom: null,                    // 构建fiber时没有dom，下次perform这个节点是才创建dom
          return: workInProgressFiber,
          alternate: null,              // 新增的没有老状态
          effectTag: 'REPLACEMENT'      // 添加一个操作标记
        }
      } else if(!sameType && oldFiber) {
        // 如果类型不一样，没有新节点，有老节点，删除老节点
        oldFiber.effectTag = 'DELETION';   // 添加删除标记
        deletions.push(oldFiber);          // 一个数组收集所有需要删除的节点
      }


      oldFiber = oldFiber.sibling;     // 循环处理兄弟元素

      // 父级的child指向第一个子元素
      if(index === 0) {
        workInProgressFiber.child = newFiber;
      } else {
        // 每个子元素拥有指向下一个子元素的指针
        prevSibling.sibling = newFiber;
      }

      prevSibling = newFiber;
    }
  }


}

// performUnitOfWork用来执行任务，参数是我们的当前fiber任务，返回值是下一个任务
function performUnitOfWork(fiber) {
  // 根节点的dom就是container，如果没有这个属性，说明当前fiber不是根节点
  if(!fiber.dom) {
    fiber.dom = createDom(fiber);   // 创建一个DOM挂载上去
  } 

  // 如果有父节点，将当前节点挂载到父节点上
  // if(fiber.return) {
  //   fiber.return.dom.appendChild(fiber.dom);
  // }

  // 将我们前面的vDom结构转换为fiber结构
  const elements = fiber.props.children;

  // 调和子元素
  reconcileChildren(fiber, elements);

  // 这个函数的返回值是下一个任务，这其实是一个深度优先遍历
  // 先找子元素，没有子元素了就找兄弟元素
  // 兄弟元素也没有了就返回父元素
  // 然后再找这个父元素的兄弟元素
  // 最后到根节点结束
  // 这个遍历的顺序其实就是从上到下，从左到右
  if(fiber.child) {
    return fiber.child;
  }

  let nextFiber = fiber;
  while(nextFiber) {
    if(nextFiber.sibling) {
      return nextFiber.sibling;
    }

    nextFiber = nextFiber.return;
  }
}
// 使用requestIdleCallback开启workLoop
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

  workInProgressRoot = {
    dom: container,
    props: {
      children: [vDom]
    },
    alternate: currentRoot
  }

  deletions = [];

  nextUnitOfWork = workInProgressRoot;

}

export default {
  createElement,
  render
}
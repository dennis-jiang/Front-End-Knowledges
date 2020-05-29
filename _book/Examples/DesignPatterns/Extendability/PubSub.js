// 先把之前的发布订阅模式拿过来
class PubSub {
  constructor() {
    this.events = {}
  }

  subscribe(event, callback) {
    if(this.events[event]) {
      this.events[event].push(callback);
    } else {
      this.events[event] = [callback]
    }
  }

  publish(event, ...args) {
    const subscribedEvents = this.events[event];

    if(subscribedEvents && subscribedEvents.length) {
      subscribedEvents.forEach(callback => {
        callback.call(this, ...args);
      });
    }
  }

  unsubscribe(event, callback) {
    const subscribedEvents = this.events[event];

    if(subscribedEvents && subscribedEvents.length) {
      this.events[event] = this.events[event].filter(cb => cb !== callback)
    }
  }
}

// 总共有 初始化页面 -> 获取最终结果 -> 运动效果 -> 运动控制 四个模块

// 实例化一个事件中心
const pubSub = new PubSub();

// 初始化页面
const domArr = [];
function initHTML(target) {
  // 总共10个可选奖品，也就是10个DIV
  for(let i = 0; i < 10; i++) {
    let div = document.createElement('div');
    div.innerHTML = i;
    div.setAttribute('class', 'item');
    target.appendChild(div);
    domArr.push(div);
  }
}

// 获取最终结果，也就是总共需要转几次，我们采用一个随机数加40
function getFinal() {
  let _num = Math.random() * 10 + 40;

  return Math.floor(_num, 0);
}

function move(moveConfig) {
  // moveConfig = {
  //   times: 10,     // 本圈移动次数
  //   speed: 50      // 本圈速递
  // }
  let current = 0; // 当前位置
  let lastIndex = 9;   // 上个位置

  const timer = setInterval(() => {
    // 每次移动移除上一个的边框，给当前元素加上边框
    if(current !== 0) {
      lastIndex = current - 1;
    }

    domArr[lastIndex].setAttribute('class', 'item');
    domArr[current].setAttribute('class', 'item item-on');

    current++;

    if(current === moveConfig.times) {
      // 转完了广播事件
      clearInterval(timer);

      if(moveConfig.times === 10) {
        pubSub.publish('finish');
      }
    }
  }, moveConfig.speed);
}

function moveController() {
  let allTimes = getFinal();
  let circles = Math.floor(allTimes / 10, 0);
  let stopNum = allTimes % circles;
  let speed = 250;  
  let ranCircle = 0;

  move({
    times: 10,
    speed
  });    // 手动开启第一次旋转

  // 每次旋转完成开启下一次旋转
  pubSub.subscribe('finish', () => {
    let time = 0;
    speed -= 50;
    ranCircle++;

    if(ranCircle <= circles) {
      time = 10;
    } else {
      time = stopNum;
    }

    move({
      times: time,
      speed,
    })
  });
}

initHTML(document.getElementById('root'));
moveController();
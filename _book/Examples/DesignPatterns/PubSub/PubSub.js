class PubSub {
  constructor() {
    // 一个对象存放所有的消息订阅
    // 每个消息对应一个数组，数组结构如下
    // {
    //   "event1": [cb1, cb2]
    // }
    this.events = {}
  }

  subscribe(event, callback) {
    if(this.events[event]) {
      // 如果有人订阅过了，这个键已经存在，就往里面加就好了
      this.events[event].push(callback);
    } else {
      // 没人订阅过，就建一个数组，回调放进去
      this.events[event] = [callback]
    }
  }

  publish(event, ...args) {
    // 取出所有订阅者的回调执行
    const subscribedEvents = this.events[event];

    if(subscribedEvents && subscribedEvents.length) {
      subscribedEvents.forEach(callback => {
        callback.call(this, ...args);
      });
    }
  }

  unsubscribe(event, callback) {
    // 删除某个订阅，保留其他订阅
    const subscribedEvents = this.events[event];

    if(subscribedEvents && subscribedEvents.length) {
      this.events[event] = this.events[event].filter(cb => cb !== callback)
    }
  }
}

const request = require("request");
const pubSub = new PubSub();

request('https://www.baidu.com', function (error, response) {
  if (!error && response.statusCode == 200) {
    console.log('get times 1');
    pubSub.publish('request1Success');
  }
});

pubSub.subscribe('request1Success', () => {
  request('https://www.baidu.com', function (error, response) {
    if (!error && response.statusCode == 200) {
      console.log('get times 2');
      pubSub.publish('request2Success');
    }
  });
})

pubSub.subscribe('request2Success', () => {
  request('https://www.baidu.com', function (error, response) {
    if (!error && response.statusCode == 200) {
      console.log('get times 3');
      pubSub.publish('request3Success');
    }
  });
})
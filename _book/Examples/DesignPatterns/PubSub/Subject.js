class Subject {
  constructor() {
    // 一个数组存放所有的订阅者
    // 每个消息对应一个数组，数组结构如下
    // [
    //   {
    //     observer: obj,
    //     action: () => {}
    //   }
    // ]
    this.observers = [];
  }

  addObserver(observer, action) {
    // 将观察者和回调放入数组
    this.observers.push({observer, action});
  }

  notify(...args) {
    // 执行每个观察者的回调
    this.observers.forEach(item => {
      const {observer, action} = item;
      action.call(observer, ...args);
    })
  }
}

const subject = new Subject();

// 添加一个观察者
subject.addObserver({name: 'John'}, function(msg){
  console.log(this.name, 'got message: ', msg);
})

// 再添加一个观察者
subject.addObserver({name: 'Joe'}, function(msg) {
  console.log(this.name, 'got message: ', msg);
})

// 通知所有观察者
subject.notify('tomorrow is Sunday');

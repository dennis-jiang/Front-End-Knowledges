function vue(){
  this.$data = {a: 1};
  this.el = document.getElementById('app');
  this.virtualDom = '';
  this.observer(this.$data);
  this.render();
}

vue.prototype.observer = function(obj){
  var value;
  var self = this;
  for(var key in obj){  // 递归设置set和get
    value = obj[key];
    
    if(typeof value === 'object'){
      this.observer(value);
    } else {
      Object.defineProperty(this.$data, key, {
        get: function(){
          return value;
        },
        set: function(newValue){
          value = newValue;
          self.render();
        }
      });
    }
  }
}

vue.prototype.render = function(){
  this.virtualDom = `I am ${this.$data.a}`;
  this.el.innerHTML = this.virtualDom;
}
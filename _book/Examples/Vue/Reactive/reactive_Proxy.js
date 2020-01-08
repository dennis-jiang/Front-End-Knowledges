function vue(){
  this.$data = {a: 1};
  this.el = document.getElementById('app');
  this.virtualDom = '';
  this.observer();
  this.render();
}

vue.prototype.observer = function(){
  var self = this;
  this.$data = new Proxy(this.$data, {
    get: function(target, key){
      return target[key];
    },
    set: function(target, key, newValue){
      target[key] = newValue;
      self.render();
    }
  });
}

vue.prototype.render = function(){
  this.virtualDom = `I am ${this.$data.a}`;
  this.el.innerHTML = this.virtualDom;
}
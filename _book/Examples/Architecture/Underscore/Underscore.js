(function(root){
  function _(value){
    if(!(this instanceof _)) {
      return new _(value);
    }

    this._wrapped = value;
  }
  
  _.map = function(array, callback) {
    var result = [];
    var length = array.length;
    for(var i = 0; i< length; i++) {
      var res = callback(array[i]);
      result[i] = res;
    }

    return result;
  }

  _.unique = function(array){
    var result = [];
    var length = array.length;
    for(var i = 0; i < length; i++) {
      if(result.indexOf(array[i]) === -1){
        result.push(array[i]);
      }
    }

    return result;
  }

  _.chain = function(obj) {
    // this._chain = true;
    // return this;

    var instance = _(obj);
    instance._chain = true;
    return instance;
  }

  _.each = function(array, callback){
    var length = array.length;
    for(var i = 0; i < length; i++) {
      callback(array[i]);
    }
  }

  _.functions = function(obj){
    var result = [];
    for(var key in obj) {
      if(typeof obj[key] === 'function'){
        result.push(key);
      }
    }
    return result;
  }

  _.prototype.value = function() {
    return this._wrapped;
  }

  _.mixin = function(obj) {
    _.each(_.functions(obj), function(item){
      var func = obj[item];
      _[item] = func;
      _.prototype[item] = function() {
        var value = this._wrapped;
        var args = [value];
        Array.prototype.push.apply(args, arguments);
        var res = func.apply(_, args);

        var isChain = this._chain;
        if(isChain) {
          // if(item !== 'chain') {
          this._wrapped = res;
          // }
          return this;
        }
        return res;
      }
    });
  }

  _.mixin(_);
  
  root._ = _;
})(this)
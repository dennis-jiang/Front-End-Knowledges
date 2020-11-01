const delegate = require("delegates");

module.exports = {
  inspect() {},
  toJSON() {},
  throw() {},
  onerror() {},
};

const proto = module.exports;

delegate(proto, "response")
  .method("set")
  .method("append")
  .access("message")
  .access("body");

delegate(proto, "request")
  .method("acceptsLanguages")
  .method("accepts")
  .access("querystring")
  .access("socket");

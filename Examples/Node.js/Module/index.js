const a = require('./a.js');
const add = require('./b.js');
const c = require('./c.js');
const d = require('./d.js');
const e = require('./e.json');

console.log(a);
console.log(add(1, 2));
console.log(c);
console.log(d);

d.num = 7;
console.log(d);

console.log(e);
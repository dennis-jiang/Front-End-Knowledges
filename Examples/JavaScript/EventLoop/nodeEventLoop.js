// console.log('outer');

// setTimeout(() => {
//   setTimeout(() => {
//     console.log('setTimeout');
//   }, 0);
//   setImmediate(() => {
//     console.log('setImmediate');
//   });
// }, 0);



// console.log('outer');

// setTimeout(() => {
//   console.log('setTimeout');
// }, 0);

// setImmediate(() => {
//   console.log('setImmediate');
// });



// var fs = require('fs')

// fs.readFile(__filename, () => {
//     setTimeout(() => {
//         console.log('setTimeout');
//     }, 0);

//     setImmediate(() => {
//         console.log('setImmediate');
        
//         process.nextTick(() => {
//           console.log('nextTick 2');
//         });
//     });

//     process.nextTick(() => {
//       console.log('nextTick 1');
//     });
// });


// console.log('outer');

// setImmediate(() => {
//   setTimeout(() => {
//     console.log('setTimeout');
//   }, 0);
//   setImmediate(() => {
//     console.log('setImmediate');
//   });
// });

const promise = Promise.resolve()
setImmediate(() => {
  console.log('setImmediate');
});
promise.then(()=>{
    console.log('promise')
})
process.nextTick(()=>{
    console.log('nextTick')
})
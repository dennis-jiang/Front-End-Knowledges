const fetch = require('node-fetch');

async function sendRequest () {
  const r1 = await fetch('https://www.baidu.com');
  const r2 = await fetch('https://www.baidu.com');
  const r3 = await fetch('https://www.baidu.com');
  
  return {
    r1,
    r2,
    r3,
  }
}

sendRequest().then((res) => {
  console.log('res', res);
});

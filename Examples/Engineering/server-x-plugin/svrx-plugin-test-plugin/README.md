svrx-plugin-test-plugin
---

[![svrx](https://img.shields.io/badge/svrx-plugin-%23ff69b4?style=flat-square)](https://svrx.io/)
[![npm](https://img.shields.io/npm/v/svrx-plugin-test-plugin.svg?style=flat-square)](https://www.npmjs.com/package/svrx-plugin-test-plugin)

The svrx plugin for test-plugin

## Usage

> Please make sure that you have installed [svrx](https://svrx.io/) already.

### Via CLI

```bash
svrx -p test-plugin
```

### Via API

```js
const svrx = require('@svrx/svrx');

svrx({ plugins: [ 'test-plugin' ] }).start();
```

## Options

<!-- TODO -->

## License

MIT
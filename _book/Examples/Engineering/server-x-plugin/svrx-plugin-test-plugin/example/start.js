const { PackageManagerCreator, logger } = require('@svrx/util');
const path = require('path');

const pm = PackageManagerCreator();
const spinner = logger.spin('Loading svrx...');

pm.load().then((svrxPkg) => {
  const Svrx = svrxPkg.module;
  if (spinner) spinner();

  process.chdir(__dirname);
  const server = new Svrx({
    root: __dirname,
    plugins: [{ path: path.resolve('..') }],
  });
  server.start();
}).catch((e) => {
  if (spinner) spinner();
  console.log('svrx load error', e);
  process.exit();
});

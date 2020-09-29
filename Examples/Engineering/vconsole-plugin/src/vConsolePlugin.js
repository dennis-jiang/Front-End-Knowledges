function createPlugin(VConsole) {
  const plugin = new VConsole.VConsolePlugin('my_plugin', 'My Plugin');

  plugin.on('init', function () {
    console.log('My plugin init');
  });


  plugin.on('renderTab', function (callback) {
    const performanceInfo = JSON.stringify(window.performance);
    var html = `
    <div>
      Here are some performance information: 
      <br/>
      ${performanceInfo}
    </div>`;
    callback(html);
  });

  return plugin;
}

export default createPlugin;
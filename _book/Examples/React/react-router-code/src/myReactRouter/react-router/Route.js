import React from "react";

import RouterContext from "./RouterContext.js";
import matchPath from "./matchPath.js";

class Route extends React.Component {
  render() {
    return (
      <RouterContext.Consumer>
        {context => {
          // 从RouterContext获取location
          const location = context.location;
          const match = this.props.computedMatch
                        ? this.props.computedMatch
                        : matchPath(location.pathname, this.props);  // 调用matchPath检测当前路由是否匹配

          const props = { ...context, location, match };

          let { component } = this.props;

          // render对应的component之前先用最新的参数match更新下RouterContext
          // 这样下层嵌套的Route可以拿到对的值
          return (
            <RouterContext.Provider value={props}>
              {props.match
                ? React.createElement(component, props)
                : null}
            </RouterContext.Provider>
          );
        }}
      </RouterContext.Consumer>
    );
  }
}

export default Route;
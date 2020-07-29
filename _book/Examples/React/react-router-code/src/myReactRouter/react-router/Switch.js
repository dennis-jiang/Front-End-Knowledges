import React from "react";

import RouterContext from "./RouterContext.js";
import matchPath from "./matchPath.js";

class Switch extends React.Component {
  render() {
    return (
      <RouterContext.Consumer>
        {context => {
          const location = context.location;     // 从RouterContext获取location

          let element, match;     // 两个变量记录第一次匹配上的子元素和match属性

          // 使用React.Children.forEach来遍历子元素，而不能使用React.Children.toArray().find()
          // 因为toArray会给每个子元素添加一个key，这会导致两个有同样component，但是不同URL的<Route>重复渲染
          React.Children.forEach(this.props.children, child => {
            // 先检测下match是否已经匹配到了
            // 如果已经匹配过了，直接跳过
            if (!match && React.isValidElement(child)) {
              element = child;

              const path = child.props.path;

              match = matchPath(location.pathname, { ...child.props, path });
            }
          });

          // 最终<Switch>组件的返回值只是匹配上子元素的一个拷贝，其他子元素被忽略了
          // match属性会被塞给拷贝元素的computedMatch
          // 如果一个都没匹配上，返回null
          return match
            ? React.cloneElement(element, { location, computedMatch: match })   
            : null;
        }}
      </RouterContext.Consumer>
    );
  }
}

export default Switch;
/** @jsxRuntime classic */
// 需加此句，否则默认为automatic，jsx不会加载我们的代码
// import React from 'react';
const container = document.getElementById("root");

function createElement (type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child => {
        return typeof child === 'object' ? child : createTextElement(child);
      })
    }
  }
}
function createTextElement (text) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: [],
    }
  }
}

function createDom (fiber) {
  const dom = 
    fiber.type === 'TEXT_ELEMENT'
        ? document.createTextNode('')
        : document.createElement(fiber.type);

  const isProperty = key => key !== 'children';
  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach(propName => {
      dom[propName] = fiber.props[propName]
    })

  return dom;
}

function render (element, container) {
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    }
  }
}

let nextUnitOfWork = null;

function workLoop (deadline) {
  // requestIdleCallback also gives us a deadline parameter. 
  // We can use it to check how much time we have until 
  // the browser needs to take control again.
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);

    shouldYield = deadline.timeRemaining() < 1;
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function performUnitOfWork (fiber) {
  /**
   * To start using the loop we’ll need to set the first unit of work,
   *  and then write a performUnitOfWork function that
   *  not only performs the work but also returns the next unit of work.
   */
  // add dom node
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom);
  }
  // create new fibers
  const elements = fiber.props.children;
  let index = 0;
  let prevSibling = null;
  while (index < elements.length) {
    // 取出一个子节点
    const element = elements[index];
    // 生成一个fiber
    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    }
    // child指向第一个子节点
    if (index === 0) {
      fiber.child = newFiber;
    } else {
      // 若存在多个子节点，将不是第一个子节点的节点挂载到前一个子节点的sibling上
      prevSibling.sibling = newFiber;
    }
    // 设置上一个子节点
    prevSibling = newFiber;
    index++;
  }
  // return next unit of work
  if (fiber.child) {
    // 存在子节点，返回其
    return fiber.child;
  }
  // 如果没有子节点
  let nextFiber = fiber;
  while (nextFiber) {
    // 如果有 兄弟节点 直接返回它
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    // 若无兄弟节点，向上查找其父亲（后续查找是否有父亲的兄弟节点（叔叔节点））
    nextFiber = nextFiber.parent;
  }
}


const Fact = {
  createElement,
  render
}

/** @jsx Fact.createElement */
const element = (
  <div style="background: salmon;">
    <h1>Hello World</h1>
    <h2 style="text-align: right;">from Fact</h2>
  </div>
)

Fact.render(element, container)
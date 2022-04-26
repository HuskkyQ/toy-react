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

function render (element, container) {
  const dom = 
    element.type === 'TEXT_ELEMENT'
      ? document.createTextNode('')
      : document.createElement(element.type);

  const isProperty = key => key !== 'children';
  Object.keys(element.props)
    .filter(isProperty)
    .forEach(propName => {
      dom[propName] = element.props[propName]
    })
  
  element.props.children.forEach(child => {
    render(child, dom);
  })

  container.appendChild(dom);
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

function performUnitOfWork (nextUnitOfWork) {
  // TODO
  /**
   * To start using the loop we’ll need to set the first unit of work,
   *  and then write a performUnitOfWork function that
   *  not only performs the work but also returns the next unit of work.
   */
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
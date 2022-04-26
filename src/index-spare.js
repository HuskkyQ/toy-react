// import React from 'react';
// import ReactDOM from 'react-dom';
import './index.css';
// import App from './App';
// 18v
// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );

// ==========================

function createElement (type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child => typeof child === 'object' ? child : createTextElement(child))
    }
  }
}

function createTextElement (text) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: []
    }
  }
}

function render (element, container) {
  console.log(element, container)
  const dom = element.type === 'TEXT_ELEMENT' ? document.createTextNode(''): document.createElement(element.type);
  
  const isProperty = key => key !== 'children';
  Object.keys(element.props)
    .filter(isProperty)
    .forEach(name => {
      dom[name] = element.props[name]
    })
  
  element.props.children.forEach(child => {
    render(child, dom);
  })
  container.appendChild(dom);
}

const Didact = {
  createElement,
  render
}
/** @jsx Didact.createElement */
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
)
// const element = Didact.createElement(
//   'div',
//   {
//     title: 'halo',
//     id: '222'
//   },
//   'emmmm',
//   Didact.createElement("a", null, "bar"),
//   Didact.createElement("b")
// );
console.log(element);


const el = document.getElementById('root');
Didact.render(element, el);

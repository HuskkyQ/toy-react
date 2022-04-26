import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
// import App from './App';
// 18v
// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );

// ==============================

// const element = <h1 title="foo">Hello</h1>;
// const element = React.createElement('h1', {
//   title: 'foo'
// }, 'Hello')
const container = document.getElementById("root");

// 0. test
const element = {
  type: 'h1',
  props: {
    title: 'foo',
    children: 'Hello'
  }
}
const node = document.createElement(element.type);
node["title"] = element.props.title;

const text = document.createTextNode('');
text["nodeValue"] = element.props.children;

node.appendChild(text);
container.appendChild(node);
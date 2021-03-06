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
  updateDom(dom, {}, fiber.props);

  return dom;
}

const isEvent = key => key.startsWith('on');
const isProperty = key => key !== "children" && !isEvent(key);
const isNew = (prev, next) => key =>
  prev[key] !== next[key];
const isGone = (prev, next) => key => !(key in next);

function updateDom(dom, prevProps, nextProps) {
  // Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(key => 
      !(key in nextProps) ||
      isNew(prevProps, nextProps)(key)
    )
    .forEach(name => {
      const eventType = name
        .toLowerCase()
        .substring(2)

      // 移除之前的事件
      dom.removeEventListener(
        eventType,
        prevProps[name]
      );
    })
  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      dom[name] = ''
    })
  // Add event listener
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name
        .toLowerCase()
        .substring(2)
      dom.addEventListener(
        eventType,
        nextProps[name]
      )
    })
  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      dom[name] = nextProps[name]
    })
}

function commitRoot () {
  deletions.forEach(commitWork);
  // add nodes to dom
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

function commitWork (fiber) {
  if (!fiber) return;

  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }
  const domParent = domParentFiber.dom;
  if (
    fiber.effectTag === 'PLACEMENT' &&
    fiber.dom !== null
  ) {
    domParent.appendChild(fiber.dom);
  } else if (
    fiber.effectTag === 'UPDATE' &&
    fiber.dom !== null
  ) {
    updateDom(
      fiber.dom,
      fiber.alternate.props,
      fiber.props
    );
  } else if (fiber.effectTag === 'DELETION') {
    commitDeletion(fiber, domParent)
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitDeletion (fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}

function render (element, container) {
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    alternate: currentRoot
  }
  deletions = [];
  nextUnitOfWork = wipRoot;
}

let nextUnitOfWork = null;
let currentRoot = null;
let wipRoot = null;
let deletions = null;

function workLoop (deadline) {
  // requestIdleCallback also gives us a deadline parameter. 
  // We can use it to check how much time we have until 
  // the browser needs to take control again.
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);

    shouldYield = deadline.timeRemaining() < 1;
  }

  if (!nextUnitOfWork && wipRoot) {
    /**
     * 一旦我们完成了所有工作
     * （我们知道这一点，因为没有下一个工作单元），我们将整个纤维树归功于DOM。
     */
    commitRoot()
  }

  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);

function performUnitOfWork (fiber) {
  const isFunctionComonent = 
    fiber.type instanceof Function;
  if (isFunctionComonent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
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

let wipFiber = null;
let hookIndex = null;

// 处理函数式组件
function updateFunctionComponent(fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  wipFiber.hooks = [];
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

function useState (initial) {
  const oldHook = 
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex];

  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: []
  }

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach(action => {
    hook.state = action(hook.state);
  })

  const setState = (action) => {
    const act = 
      typeof action === 'function'
        ? action
        : () => action
    hook.queue.push(act);
    /**
     * 然后，我们做类似于在渲染功能中所做的事情的事情，
     * 将新的工作扎根为下一个工作单元，
     * 以便工作循环可以启动新的渲染阶段。
     */
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    }
    nextUnitOfWork = wipRoot;
    deletions = [];
  }

  wipFiber.hooks.push(hook);
  hookIndex++;
  return [hook.state, setState];
}

function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children)
}

function reconcileChildren (wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;

  while (index < elements.length || oldFiber != null) {
    // 取出一个子节点
    const element = elements[index];
    let newFiber = null;
    // compare oldFiber to element
    const sameType = 
      oldFiber &&
      element &&
      element.type === oldFiber.type;
    
    if (sameType) {
      // update the node
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: 'UPDATE'
      }
    }
    if (element && !sameType) {
      // add this node
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: 'PLACEMENT'
      }
    }
    if (oldFiber && !sameType) {
      // delete the oldFiber's node
      oldFiber.effectTag = 'DELETION';
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }
    // child指向第一个子节点
    if (index === 0) {
      wipFiber.child = newFiber;
    } else {
      // 若存在多个子节点，将不是第一个子节点的节点挂载到前一个子节点的sibling上
      prevSibling.sibling = newFiber;
    }
    // 设置上一个子节点
    prevSibling = newFiber;
    index++;
  }
}

const Fact = {
  createElement,
  render,
  useState
}

/** @jsx Fact.createElement */
// const element = (
//   <div style="background: salmon;">
//     <h1>Hello World</h1>
//     <h2 style="text-align: right;">from Fact</h2>
//   </div>
// )

// Fact.render(element, container)

function Counter() {
  const [state, setState] = Fact.useState(1)
  const [state1, setState1] = Fact.useState(1)
  return (
    <div>
      {/* 两种方式 */}
      {/* <h1 onClick={() => setState(c => c + 1)}> */}
      <h1 onClick={() => setState(state + 1)}>
        Count: {state}
      </h1>
      <h2 onClick={() => setState1(c => c + 1)}>
        Count2: {state1}
      </h2>
    </div>
  )
}
const element = <Counter />
Fact.render(element, container)
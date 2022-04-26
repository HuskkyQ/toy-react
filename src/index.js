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

  const domParent = fiber.parent.dom;
  // 需要根据情况处理
  // domParent.appendChild(fiber.dom);
  if (fiber.effectTag === 'PLACEMENT' && fiber.dom !== null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === 'UPDATE' && fiber.dom !== null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === 'DELETION') {
    domParent.removeChild(fiber.dom);
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
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
  /**
   * To start using the loop we’ll need to set the first unit of work,
   *  and then write a performUnitOfWork function that
   *  not only performs the work but also returns the next unit of work.
   */
  // add dom node
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }
  /**
   * 每次我们在元素上工作时，我们都会为DOM添加一个新节点。
   * 而且，请记住，浏览器可以在完成整棵树之前打断我们的工作。
   * 在这种情况下，用户将看到一个不完整的UI。我们不想要那个。
   * 去除以下
   */
  // if (fiber.parent) {
  //   fiber.parent.dom.appendChild(fiber.dom);
  // }


  // create new fibers
  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);
  
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
  render
}

/** @jsx Fact.createElement */
// const element = (
//   <div style="background: salmon;">
//     <h1>Hello World</h1>
//     <h2 style="text-align: right;">from Fact</h2>
//   </div>
// )

// Fact.render(element, container)

const updateValue = e => {
  rerender(e.target.value)
}

const rerender = value => {
  const element = (
    <div>
      <input onInput={updateValue} value={value} />
      <h2>Hello {value}</h2>
    </div>
  )
  Fact.render(element, container)
}

rerender("World")
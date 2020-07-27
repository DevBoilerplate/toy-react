class ElementWrapper {
    constructor(type) {
        this.root = document.createElement(type)
    }
    setAttribute(name, value) {
        this.root.setAttribute(name, value)
    }
    appendChild(vchild) {
        vchild.mountTo(this.root)
    }
    mountTo(parent) {
        parent.appendChild(this.root)
    }
}

class TextWrapper {
    constructor(content) {
        this.root = document.createTextNode(content)
    }
    mountTo(parent) {
        parent.appendChild(this.root)
    }
}

export class Component {
    // 抽象继承组件
    constructor() {
        this.children = []
    }
    // 设置属性
    setAttribute(name, value) {
        this[name] = value
    }
    // 设置挂载
    mountTo(parent) {
        let vdom = this.render()
        vdom.mountTo(parent)
    }
    // 添加子组件
    appendChild(vchild) {
        this.children.push(vchild)
    }
}

export const ToyReact = {
    createElement(type, attributes, ...children) {
        let element
        if (typeof type === "string") {
            element = new ElementWrapper(type)
        } else {
            element = new type()
        }

        for (let name in attributes) {
            element.setAttribute(name, attributes[name])
        }

        // 插入子组件,递归
        let insertChildren = (children) => {
            for (let child of children) {
                if (typeof child === "object" && child instanceof Array) {
                    insertChildren(child)
                } else {
                    // 转化为字符串
                    if (
                        !(child instanceof Component) &&
                        !(child instanceof TextWrapper) &&
                        !(child instanceof ElementWrapper)
                    )
                        child = String(child)
                    if (typeof child === "string")
                        child = new TextWrapper(child)
                    element.appendChild(child)
                }
            }
        }
        insertChildren(children)

        return element
    },
    render(vdom, element) {
        vdom.mountTo(element)
    },
}

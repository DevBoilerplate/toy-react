class ElementWrapper {
    constructor(type) {
        this.root = document.createElement(type)
    }
    setAttribute(name, value) {
        if (name.match(/^on([\s\S]+)$/)) {
            let eventName = RegExp.$1.replace(/^[\s\S]/, (s) => s.toLowerCase())
            this.root.addEventListener(eventName, value)
        }

        if (name === "className") name = "class"

        this.root.setAttribute(name, value)
    }
    appendChild(vchild) {
        // 插入范围的子节点
        let range = document.createRange()
        if (this.root.children.length) {
            range.setStartAfter(this.root.lastChild)
            range.setEndAfter(this.root.lastChild)
        } else {
            range.setStart(this.root, 0)
            range.setEnd(this.root, 0)
        }
        vchild.mountTo(range)
    }
    mountTo(range) {
        range.deleteContents()
        range.insertNode(this.root)
    }
}

class TextWrapper {
    constructor(content) {
        this.root = document.createTextNode(content)
    }
    mountTo(range) {
        range.deleteContents()
        range.insertNode(this.root)
    }
}

export class Component {
    // 抽象继承组件
    constructor() {
        this.children = []
        this.props = Object.create(null)
    }
    // 设置属性
    setAttribute(name, value) {
        if (name.match(/^on([\s\S]+)$/)) {
            console.log(RegExp.$1)
        }

        this.props[name] = value
        this[name] = value
    }
    // 设置挂载
    mountTo(range) {
        // 解决重新渲染的问题
        this.range = range
        this.update()
    }
    update() {
        let placeholder = document.createComment("placeholder")
        let range = document.createRange()
        range.setStart(this.range.endContainer, this.range.endOffset)
        range.setEnd(this.range.endContainer, this.range.endOffset)
        range.insertNode(placeholder)

        this.range.deleteContents()

        let vdom = this.render()
        vdom.mountTo(this.range)
        // placeholder.parentNode.removeChild(placehoader)
    }
    // 添加子组件
    appendChild(vchild) {
        this.children.push(vchild)
    }
    setState(state) {
        // 递归合并，判断是否为对象
        let merge = (oldState, newState) => {
            for (let p in newState) {
                if (typeof newState[p] === "object") {
                    if (typeof oldState[p] !== "object") {
                        oldState[p] = {}
                    }
                    merge(oldState[p], newState[p])
                } else {
                    oldState[p] = newState[p]
                }
            }
        }
        if (!this.state && state) this.state = {}
        merge(this.state, state)
        this.update()
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
        let range = document.createRange()
        if (element.children.length) {
            range.setStartAfter(element.lastChild)
            range.setEndAfter(element.lastChild)
        } else {
            range.setStart(element, 0)
            range.setEnd(element, 0)
        }
        vdom.mountTo(range)
    },
}

let childrenSymbol = Symbol("children")
class ElementWrapper {
    constructor(type) {
        this.type = type
        this.props = Object.create(null)
        this[childrenSymbol] = []
    }
    get vdom() {
        return this
    }
    get children() {
        return this[childrenSymbol].map(child => child.vdom)
    }
    setAttribute(name, value) {
        // if (name.match(/^on([\s\S]+)$/)) {
        //     let eventName = RegExp.$1.replace(/^[\s\S]/, (s) => s.toLowerCase())
        //     this.root.addEventListener(eventName, value)
        // }

        // if (name === "className") name = "class"

        // this.root.setAttribute(name, value)
        this.props[name] = value
    }
    appendChild(vchild) {
        this[childrenSymbol].push(vchild)
        this.children.push(vchild.vdom)
        // 插入范围的子节点
        // let range = document.createRange()
        // if (this.root.children.length) {
        //     range.setStartAfter(this.root.lastChild)
        //     range.setEndAfter(this.root.lastChild)
        // } else {
        //     range.setStart(this.root, 0)
        //     range.setEnd(this.root, 0)
        // }
        // vchild.mountTo(range)
    }
    mountTo(range) {
        this.range = range
        let placehoader = document.createComment("placeholder")
        let endRange = document.createRange()
        endRange.setStart(range.endContainer , range.endOffset)
        endRange.setEnd(range.endContainer , range.endOffset)
        endRange.insertNode(placehoader)

        range.deleteContents()
        let element = document.createElement(this.type)
        for (let name in this.props) {
            let value = this.props[name]
            element.setAttribute(name, value)
            if (name.match(/^on([\s\S]+)$/)) {
                let eventName = RegExp.$1.replace(/^[\s\S]/, (s) =>
                    s.toLowerCase()
                )
                element.addEventListener(eventName, value)
            }

            if (name === "className") name = "class"
            element.setAttribute(name, value)
        }

        for (let child of this.children) {
            let range = document.createRange()
            if (element.children.length) {
                range.setStartAfter(element.lastChild)
                range.setEndAfter(element.lastChild)
            } else {
                range.setStart(element, 0)
                range.setEnd(element, 0)
            }
            child.mountTo(range)
        }

        range.insertNode(element)
    }
}

class TextWrapper {
    constructor(content) {
        this.root = document.createTextNode(content)
        this.type = "#text"
        this.children = []
        this.props = Object.create(null)
    }
    get vdom() {
        return this
    }
    mountTo(range) {
        this.range = range
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
    get type() {
        return this.constructor.name
    }
    // 设置属性
    setAttribute(name, value) {
        // if (name.match(/^on([\s\S]+)$/)) {
        //     console.log(RegExp.$1)
        // }

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
        // let placeholder = document.createComment("placeholder")
        // let range = document.createRange()
        // range.setStart(this.range.endContainer, this.range.endOffset)
        // range.setEnd(this.range.endContainer, this.range.endOffset)
        // range.insertNode(placeholder)

        // this.range.deleteContents()

        let vdom = this.vdom
        if (this.oldVdom) {
            let isSameNode = (node1, node2) => {
                if (node1.type !== node2.type) {
                    return false
                }
                for (let name in node1.props) {
                    // 判断onClick
                    // if (
                    //     typeof node1.props[name] === "function" &&
                    //     typeof node2.props[name] === "function" &&
                    //     node1.props[name].toString() ===
                    //         node2.props[name].toString()
                    // ) {
                    //     continue
                    // }
                    if (
                        typeof node1.props[name] === "object" &&
                        typeof node2.props[name] === "object" &&
                        JSON.stringify(node1.props[name]) ===
                            JSON.stringify(node2.props[name])
                    ) {
                        continue
                    }
                    if (node1.props[name] !== node2.props[name]) {
                        return false
                    }
                }
                if (
                    Object.keys(node1.props).length !==
                    Object.keys(node2.props).length
                ) {
                    return false
                }
                return true
            }
            let isSameTree = (node1, node2) => {
                if (!isSameNode(node1, node2)) {
                    return false
                }
                if (node1.children.length !== node2.children.length) {
                    return false
                }
                for (let i = 0; i < node1.children.length; i++) {
                    if (!isSameTree(node1.children[i], node2.children[i])) {
                        return false
                    }
                }
                return true
            }

            let replace = (newTree, oldTree) => {
                if (isSameTree(newTree, oldTree)) return
                if (!isSameNode(newTree, oldTree)) {
                    newTree.mountTo(oldTree.range)
                } else {
                    // 子节点处理
                    for (let i = 0; i < newTree.children.length; i++) {
                        replace(newTree.children[i], oldTree.children[i])
                    }
                }
            }
            replace(vdom, this.oldVdom)
        } else {
            vdom.mountTo(this.range)
        }
        this.oldVdom = vdom

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
                if (typeof newState[p] === "object" && newState[p] !== null) {
                    if (typeof oldState[p] !== "object") {
                        // 判断是不是数组
                        if (newState[p] instanceof Array) {
                            oldState[p] = []
                        } else {
                            oldState[p] = {}
                        }
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
                    if (child === null || child === void 0) {
                        child = ""
                    }
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

import { ToyReact, Component } from "./ToyReact"

class MyComponent extends Component {
    render() {
        return (
            <div>
                <span>Hello World</span>
                <span>123123</span>
                <div>{this.children}</div>
            </div>
        )
    }
}

let a = (
    <MyComponent name="a" id="ida">
        <div>323423423</div>
    </MyComponent>
)

// let a = <div name="a">
//     <span>a</span>
//     <span></span>
//     <span></span>
//     <span></span>
//     <span></span>
//     <span></span>
// </div>

// document.body.appendChild(a)

ToyReact.render(a, document.body)

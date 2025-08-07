export default class {
    __future_resolvers: (() => void)[];

    constructor(button: HTMLButtonElement) {
        this.__future_resolvers = []
        button.addEventListener("click", () => this.__handle_click())
    }

    wait() {
        return new Promise(resolve => {
            this.__future_resolvers.push(resolve)
        })
    }

    __handle_click() {
        const future_resolvers = this.__future_resolvers
        this.__future_resolvers = []
        for (const resolve of future_resolvers) {
            resolve()
        }
    }
}

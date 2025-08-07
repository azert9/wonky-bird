import {BIRD_POSITION_X, BIRD_WIDTH, BIRD_HEIGHT, PIPE_COUNT, PIPE_WIDTH, PIPE_GAP} from "./constants";

export default class {
    private readonly __root_element: HTMLElement
    private readonly __height: number
    private readonly __pipes: HTMLElement[]
    private readonly __bird: HTMLElement
    private readonly __hud: HTMLElement

    constructor(root_element: HTMLElement) {
        this.__root_element = root_element
        this.__height = this.__root_element.clientHeight  // according to firefox's profiler, this is expensive to get

        // pipes are stored as [top, bottom, top, bottom, ...]
        this.__pipes = [];
        for (let i = 0; i < 2 * PIPE_COUNT; i++) {
            let pipe = document.createElement("div")
            pipe.style.position = "absolute"
            pipe.style.backgroundColor = "green"
            pipe.style.width = this.__height * PIPE_WIDTH + "px"
            if (i % 2 === 0)
                pipe.style.top = "0"
            else
                pipe.style.bottom = "0"
            this.__pipes.push(pipe)
            this.__root_element.appendChild(pipe)
        }

        this.__bird = document.createElement("div")
        this.__bird.style.position = "absolute"
        this.__bird.style.backgroundColor = "yellow"
        this.__bird.style.left = this.__height * BIRD_POSITION_X + "px"
        this.__bird.style.width = this.__height * BIRD_WIDTH + "px"
        this.__bird.style.height = this.__height * BIRD_HEIGHT + "px"
        this.__root_element.appendChild(this.__bird)

        this.__hud = document.createElement("div")
        this.__hud.style.position = "absolute"
        this.__hud.style.left = "10px"
        this.__hud.style.top = "10px"
        this.__root_element.appendChild(this.__hud)
    }

    set_blured(blured: boolean) {
        this.__root_element.style.filter = blured ? "blur(10px)" : null;
    }

    set_score(score) {
        this.__hud.textContent = score
    }

    set_bird_position(position_y) {
        let position = this.__height * position_y
        this.__bird.style.top = position + "px"
    }

    set_pipe_position(pipe_index, x, y) {
        let top_pipe = this.__pipes[2 * pipe_index]
        let bottom_pipe = this.__pipes[2 * pipe_index + 1]

        top_pipe.style.left = this.__height * x + "px"
        top_pipe.style.height = Math.max(0, this.__height * (y - PIPE_GAP / 2)) + "px"

        bottom_pipe.style.left = this.__height * x + "px"
        bottom_pipe.style.height = Math.max(0, this.__height * (1 - y - PIPE_GAP / 2)) + "px"
    }
};

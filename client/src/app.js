const BIRD_POSITION_X = 0.02
const BIRD_WIDTH = 0.05
const BIRD_HEIGHT = 0.05
const PIPE_WIDTH = 0.1
const PIPE_COUNT = 3
const PIPE_SPACING = PIPE_WIDTH * 6
const PIPE_GAP = BIRD_WIDTH * 6  // gap between top and bottom pipes
const PIPE_MIN_HEIGHT = BIRD_HEIGHT
const STARTING_GRACE = PIPE_SPACING

const GRAVITY = 3
const FLAP_DURATION = 0.3
const FLAP_SPEED = 1;
const MAX_SPEED_UP = 1
const MAX_SPEED_DOWN = 1.5
const AIR_FRICTION = 0.2  // 0 = no friction, 1 = no motion

const SCROLL_SPEED_START = 0.2
const SCROLL_SPEED_INCREMENT = 0.01
const SCROLL_SPEED_MAX = 1.5

class Game {
    constructor() {
        this.reset()
    }

    reset() {
        this.score = 0
        this.is_lost = false

        this.scroll_speed = SCROLL_SPEED_START

        // position of the top left corner of the bird
        this.bird_position_y = 0.5 - BIRD_HEIGHT / 2

        this.bird_speed_y = 0

        // circular array of pipe coordinates
        this.leftmost_pipe_index = 0
        this.pipe_positions_x = []
        this.pipe_positions_y = []
        this.pipe_counted_in_score = []
        for (let i = 0; i < PIPE_COUNT; i++) {
            this.pipe_positions_x.push(STARTING_GRACE + i * PIPE_SPACING)
            this.pipe_positions_y.push(this.__random_pipe())
            this.pipe_counted_in_score.push(false)
        }
    }

    update(elapsed) {
        let delta_t = Math.min(elapsed, 200) / 1000

        if (!this.is_lost) {
            this.__update_bird(delta_t)
            this.__update_pipes(delta_t)
            this.__check_bird_collision_with_pipe()
        }
    }

    __update_bird(delta_t, flap_duration) {
        // applying gravity
        this.bird_speed_y += GRAVITY * delta_t

        // applying speed to position
        this.bird_position_y += this.bird_speed_y * delta_t

        // applying air friction
        this.bird_speed_y -= this.bird_speed_y * AIR_FRICTION * delta_t

        // clamping speed
        this.bird_speed_y = Math.max(this.bird_speed_y, -MAX_SPEED_UP)
        this.bird_speed_y = Math.min(this.bird_speed_y, MAX_SPEED_DOWN)

        // handling root collisions
        if (this.bird_position_y <= 0) {
            this.bird_position_y = 0
            this.bird_speed_y = 0
        }

        // handling floor collisions
        if (this.bird_position_y >= 1 - BIRD_HEIGHT) {
            this.bird_position_y = 1 - BIRD_HEIGHT
            this.bird_speed_y = 0
        }
    }

    __update_pipes(delta_t) {
        // advancing pipes
        for (let i = 0; i < PIPE_COUNT; i++)
            this.pipe_positions_x[i] -= this.scroll_speed * delta_t

        // rotating pipes when they exit the screen
        if (this.pipe_positions_x[this.leftmost_pipe_index] < -PIPE_WIDTH) {
            if (!this.pipe_counted_in_score[this.leftmost_pipe_index])
                this.__increment_score()

            let rightmost_pipe_index = this.leftmost_pipe_index
            this.leftmost_pipe_index = (this.leftmost_pipe_index + 1) % PIPE_COUNT
            let second_rightmost_pipe_index = (rightmost_pipe_index + PIPE_COUNT - 1) % PIPE_COUNT

            this.pipe_positions_x[rightmost_pipe_index] = this.pipe_positions_x[second_rightmost_pipe_index] + PIPE_SPACING
            this.pipe_positions_y[rightmost_pipe_index] = this.__random_pipe()
            this.pipe_counted_in_score[rightmost_pipe_index] = false
        }
    }

    __check_bird_collision_with_pipe() {
        let bird_left = BIRD_POSITION_X
        let bird_right = bird_left + BIRD_WIDTH
        let bird_top = this.bird_position_y
        let bird_bottom = this.bird_position_y + BIRD_HEIGHT

        for (let i = 0; i < PIPE_COUNT; i++) {
            let pipe_left = this.pipe_positions_x[i]
            let pipe_right = pipe_left + PIPE_WIDTH

            if (bird_right <= pipe_left)
                continue

            if (bird_left >= pipe_right) {
                if (!this.pipe_counted_in_score[i]) {
                    this.pipe_counted_in_score[i] = true
                    this.__increment_score()
                }
                continue
            }

            let top_pipe_bottom = this.pipe_positions_y[i] - PIPE_GAP / 2
            let bottom_pipe_top = this.pipe_positions_y[i] + PIPE_GAP / 2

            if (bird_bottom > bottom_pipe_top || bird_top < top_pipe_bottom) {
                this.is_lost = true
                break
            }
        }
    }

    __random_pipe() {
        const min = PIPE_GAP / 2 + PIPE_MIN_HEIGHT
        return Math.random() * (1 - 2 * min) + min
    }

    __increment_score() {
        this.score++
        this.scroll_speed = Math.min(SCROLL_SPEED_MAX, this.scroll_speed + SCROLL_SPEED_INCREMENT)
    }

    flap() {
        this.flapping_for = FLAP_DURATION
        this.bird_speed_y = -FLAP_SPEED
    }
}

class GameView {
    constructor(root_element) {
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
}

class Screen {
    constructor(body) {
        this.screen_height_px = document.body.clientHeight;
        this.screen_width_px = Math.min(document.body.clientWidth, this.screen_height_px * 0.7);

        let screen = document.getElementById("screen")
        screen.style.position = "absolute"
        screen.style.backgroundColor = "grey"
        screen.style.overflow = "hidden"
        screen.style.width = this.screen_width_px + "px"
        screen.style.height = this.screen_height_px + "px"
        screen.style.margin = "0 auto"

        this.game = new GameView(document.getElementById("game"))

        this.username_screen = document.getElementById("username-screen")
        this.username_form = document.getElementById("username-form")

        this.leaderboard_screen = document.getElementById("leaderboard-screen")
        this.leaderboard_table = document.getElementById("leaderboard-table")
    }

    reset() {
        this.username_screen.style.display = "none"
        this.leaderboard_screen.style.display = "none"
        this.leaderboard_table.innerHTML = ""
    }

    show_username_form(callback) {
        this.username_screen.style.display = "flex"

        // TODO: remove this listener on reset()
        this.username_form.addEventListener("submit", (event) => {
            event.preventDefault()
            let username = event.currentTarget.elements["username"].value
            this.username_screen.style.display = "none"
            callback(username)
            return false
        })
    }

    show_leaderboard(scores) {
        this.leaderboard_screen.style.display = "flex"

        for (let entry of scores) {
            let row = document.createElement("tr")
            let cell1 = document.createElement("td")
            cell1.textContent = entry.username
            row.appendChild(cell1)
            let cell2 = document.createElement("td")
            cell2.textContent = entry.score
            row.appendChild(cell2)
            this.leaderboard_table.appendChild(row)
        }
    }
}

class GameLoop {
    constructor(game, game_view) {
        this.__game = game
        this.__game_view = game_view
    }

    run() {
        return new Promise(resolve => {
            this.__run(resolve)
        })
    }

    __run(game_over_callback) {
        this.__game_view.set_bird_position(this.__game.bird_position_y)
        // TODO: set visible after first update

        const keypress_handler = (event) => {
            if (event.code === "Space")
                this.__game.flap()
        }
        document.addEventListener("keypress", keypress_handler, false)

        const touchstart_handler = (event) => {
            this.__game.flap()
            event.preventDefault()
        }
        document.addEventListener("touchstart", touchstart_handler, false)

        let t = performance.now()

        let frame_interval = window.setInterval(() => {
            let t_next = performance.now()
            this.__game.update(t_next - t)
            this.__game_view.set_bird_position(this.__game.bird_position_y)
            for (let i = 0; i < PIPE_COUNT; i++) {
                this.__game_view.set_pipe_position(
                    i,
                    this.__game.pipe_positions_x[i],
                    this.__game.pipe_positions_y[i]
                )
            }
            this.__game_view.set_score(this.__game.score)
            if (this.__game.is_lost) {
                window.clearInterval(frame_interval)
                document.removeEventListener("keypress", keypress_handler, false)
                document.removeEventListener("touchstart", touchstart_handler, false)
                game_over_callback()
            }
            t = t_next
        }, 1000 / 60)
    }
}

async function game_over(score, screen) {

    let username = window.localStorage.getItem("username")

    if (username !== null) {
        await submit_score_and_show_leaderboard(score, username, screen)
    } else {
        screen.show_username_form((username) => {
            window.localStorage.setItem("username", username)
            submit_score_and_show_leaderboard(score, username, screen)
        })
    }
}

async function submit_score_and_show_leaderboard(score, username, screen) {

    await fetch("api/score", {
        method: "POST",
        body: JSON.stringify({
            username: username,
            score: score,
        }),
    })

    let response = await fetch("api/leaderboard")
    let leaderboard = await response.json()

    screen.show_leaderboard(leaderboard)
}

class WaitableButton {
    constructor(button) {
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

async function main() {
    const game = new Game()
    const screen = new Screen(document.body)
    const game_loop = new GameLoop(game, screen.game)
    const play_again_button = new WaitableButton(document.getElementById("play-again-button"))

    while (true) {
        await game_loop.run()
        await game_over(game.score, screen)
        await play_again_button.wait()
        game.reset()
        screen.reset()
    }
}

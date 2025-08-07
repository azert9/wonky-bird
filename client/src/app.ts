import Game from "./Game";
import GameView from "./GameView";
import {PIPE_COUNT} from "./constants";
import WaitableButton from "./WaitableButton";

class Screen {
    readonly screen_height_px;
    readonly screen_width_px;
    readonly game: GameView;
    readonly username_screen;
    readonly username_form;
    readonly leaderboard_screen;
    readonly leaderboard_table;

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
    private readonly __game: Game;
    private readonly __game_view: GameView;

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

async function main() {
    const game = new Game()
    const screen = new Screen(document.body)
    const game_loop = new GameLoop(game, screen.game)
    const play_again_button = new WaitableButton(document.getElementById("play-again-button") as HTMLButtonElement)

    while (true) {
        await game_loop.run()
        await game_over(game.score, screen)
        await play_again_button.wait()
        game.reset()
        screen.reset()
    }
}

window.main = main;

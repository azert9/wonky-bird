import Game from "./Game";
import GameView from "./GameView";
import {PIPE_COUNT} from "./constants";
import Server from "./Server";
import Screen from "./Screen";

async function gameLoop(game_view: GameView): Promise<number> {
    const game = new Game();

    game_view.set_bird_position(game.bird_position_y)
    // TODO: set visible after first update

    const keypress_handler = (event) => {
        if (event.code === "Space")
            game.flap()
    }
    document.addEventListener("keypress", keypress_handler, false)

    const touchstart_handler = (event) => {
        game.flap()
        event.preventDefault()
    }
    document.addEventListener("touchstart", touchstart_handler, false)

    let t = performance.now()

    await new Promise(resolve => {
        let frame_interval = window.setInterval(() => {
            let t_next = performance.now()
            game.update(t_next - t)
            game_view.set_bird_position(game.bird_position_y)
            for (let i = 0; i < PIPE_COUNT; i++) {
                game_view.set_pipe_position(
                    i,
                    game.pipe_positions_x[i],
                    game.pipe_positions_y[i]
                )
            }
            game_view.set_score(game.score)
            if (game.is_lost) {
                window.clearInterval(frame_interval)
                document.removeEventListener("keypress", keypress_handler, false)
                document.removeEventListener("touchstart", touchstart_handler, false)
                resolve()
            }
            t = t_next
        }, 1000 / 60)
    });

    return game.score;
}

async function get_username(screen: Screen): Promise<string> {
    let username = window.localStorage.getItem("username")
    if (username === null) {
        username = await screen.show_username_form();
        window.localStorage.setItem("username", username);
    }
    return username;
}

async function main() {
    const screen = new Screen()

    let server = null;

    while (true) {
        let game_start_t = performance.now();

        const score = await gameLoop(screen.game);

        if (server === null) {
            const username = await get_username(screen);
            server = new Server(username);
        }

        try {
            await server.push_recorded_game({
                score: score,
                game_over_timestamp_ms: Date.now(),
                game_duration_ms: performance.now() - game_start_t,
            });
            const leaderboard = await server.get_leaderboard();
            await screen.show_game_over(leaderboard);
        } catch (e) {
            console.error(`something went wrong: ${e}`);
            await screen.show_game_over(null);
        }

        screen.reset()
    }
}

main();

const RECORDED_GAMES_QUEUE_LOCAL_STORAGE_KEY = "recorded-games";
const API_URL: string = get_api_url();

function get_api_url(): string {
    let url = process.env.API_URL || "";
    if (url !== "" && !url.endsWith("/")) {
        url += "/";
    }
    return url;
}

export default class {
    private readonly __username: string;
    private readonly __recorded_games_queue: RecordedGame[] = [];

    constructor(username: string) {
        this.__username = username;

        const recorded_games = window.localStorage.getItem(RECORDED_GAMES_QUEUE_LOCAL_STORAGE_KEY);
        if (recorded_games !== null) {
            try {
                this.__recorded_games_queue = JSON.parse(recorded_games);
            } catch (e) {
                console.error(`failed to parse saved recorded games: ${e}`);
            }
        }
    }

    async push_recorded_game(game: RecordedGame) {
        this.__recorded_games_queue.push(game);
        window.localStorage.setItem(
            RECORDED_GAMES_QUEUE_LOCAL_STORAGE_KEY,
            JSON.stringify(this.__recorded_games_queue),
        );
        await this.__try_upload_recorded_games();
    }

    async get_leaderboard(): Promise<LeaderboardEntry[]> {
        const response = await fetch(API_URL + "api/leaderboard");
        return await response.json();
    }

    private async __try_upload_recorded_games() {
        if (this.__recorded_games_queue.length !== 0) {
            const resp = await fetch(API_URL + "api/games", {
                method: "POST",
                body: JSON.stringify({
                    username: this.__username,
                    games: this.__recorded_games_queue,
                }),
            });
            if (!resp.ok) {
                throw new Error(`failed to post recorded games: ${resp.status}`);
            }
            this.__recorded_games_queue.splice(0, this.__recorded_games_queue.length);
            window.localStorage.removeItem(RECORDED_GAMES_QUEUE_LOCAL_STORAGE_KEY);
        }
    }
}

export interface RecordedGame {
    score: number;
    game_over_timestamp_ms: number;
    duration_ms: number;
}

export interface LeaderboardEntry {
    username: string;
    score: number;
}

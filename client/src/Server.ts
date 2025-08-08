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
    private readonly __score_queue: number[] = [];

    constructor(username: string) {
        this.__username = username;

        const savedScoreQueue = window.localStorage.getItem("score-queue");
        if (savedScoreQueue !== null) {
            try {
                this.__score_queue = JSON.parse(savedScoreQueue);
            } catch (e) {
                console.error(`failed to parse saved score queue: ${e}`);
            }
        }
    }

    async push_score(score: number) {
        this.__score_queue.push(score);
        this.__save_score_queue();
        await this.__try_upload_scores();
    }

    async get_leaderboard(): Promise<Score[]> {
        const response = await fetch(API_URL + "api/leaderboard");
        return await response.json();
    }

    private async __try_upload_scores() {
        while (this.__score_queue.length !== 0) {
            // TODO: post multiple scores at once
            // TODO: avoid posting duplicate
            const resp = await fetch(API_URL + "api/score", {
                method: "POST",
                body: JSON.stringify({
                    username: this.__username,
                    score: this.__score_queue[0],
                }),
            });
            if (!resp.ok) {
                throw new Error(`failed to post score: ${resp.status}`);
            }
            this.__score_queue.shift();
            this.__save_score_queue();
        }
    }

    private __save_score_queue() {
        window.localStorage.setItem("score-queue", JSON.stringify(this.__score_queue));
    }
}

export interface Score {
    username: string;
    score: number;
}

export default class {
    private readonly __username: string;
    private readonly __queue: number[] = [];

    constructor(username: string) {
        this.__username = username;
    }

    async push_score(score: number) {
        this.__queue.push(score);
        await this.__try_upload_scores();
    }

    async get_leaderboard(): Promise<Score[]> {
        const response = await fetch("api/leaderboard");
        return await response.json();
    }

    private async __try_upload_scores() {
        while (this.__queue.length !== 0) {
            // TODO: post multiple scores at once
            // TODO: avoid posting duplicate
            await fetch("api/score", {
                method: "POST",
                body: JSON.stringify({
                    username: this.__username,
                    score: this.__queue[0],
                }),
            });
            this.__queue.shift();
        }
    }
}

export interface Score {
    username: string;
    score: number;
}

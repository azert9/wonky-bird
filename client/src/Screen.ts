import GameView from "./GameView";
import WaitableButton from "./WaitableButton";
import {Score} from "./Server";

export default class {
    readonly screen_height_px;
    readonly screen_width_px;
    readonly game: GameView;
    readonly foreground_view: HTMLElement;

    constructor() {
        this.screen_height_px = document.body.clientHeight;
        this.screen_width_px = Math.min(document.body.clientWidth, this.screen_height_px * 0.7);

        let screen = document.getElementById("screen");
        screen.style.position = "absolute";
        screen.style.backgroundColor = "grey";
        screen.style.overflow = "hidden";
        screen.style.width = this.screen_width_px + "px";
        screen.style.height = this.screen_height_px + "px";
        screen.style.margin = "0 auto";

        this.game = new GameView(document.getElementById("game"));

        this.foreground_view = document.getElementById("foreground-view");
    }

    reset() {
        this.game.set_blured(false);
        this.__set_foreground_view(null);
    }

    async show_username_form(): Promise<string> {
        return await new Promise<string>(resolve => {
            this.__set_foreground_view(usernameSelectionView((username) => {
                resolve(username);
            }));
        });
    }

    async show_game_over(scores: Score[] | null) {
        this.game.set_blured(true);
        await new Promise(resolve => {
            this.__set_foreground_view(gameOverView(scores, () => resolve()));
        })
    }

    private __set_foreground_view(view: HTMLElement | null) {
        this.foreground_view.innerHTML = "";
        if (view !== null) {
            this.foreground_view.appendChild(view);
        }
    }
}

function usernameSelectionView(onUsernameSubmitted: (username: string) => void): HTMLElement {
    const container = document.createElement("div");
    container.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.alignItems = "center";
    container.style.padding = "60px";

    const form = document.createElement("form");
    container.appendChild(form);

    const label = document.createElement("label");
    label.textContent = "Ton nom :";
    form.appendChild(label);

    const usernameInput = document.createElement("input");
    usernameInput.type = "text";
    usernameInput.name = "username";
    usernameInput.required = true;
    label.appendChild(usernameInput);

    const submitInput = document.createElement("input");
    submitInput.type = "submit";
    submitInput.value = "Valider";
    submitInput.required = true;
    form.appendChild(submitInput);

    form.addEventListener("submit", (event) => {
        // TODO: perform basic pre-validation
        event.preventDefault()
        let username = event.currentTarget.elements["username"].value
        onUsernameSubmitted(username)
        return false
    });

    return container;
}

function gameOverView(scores: Score[], onPlayAgainClicked) {

    const container = document.createElement("div");
    container.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.display = "flex";
    container.style.flexDirection = "column";

    const main = document.createElement("div");
    main.style.flexGrow = "1";
    main.style.padding = "60px";
    main.style.overflowY = "scroll";
    container.appendChild(main);

    if (scores === null) {
        main.appendChild(offlineMessage());
    } else {
        main.appendChild(scoreTable(scores));
    }

    container.appendChild(playAgainButton(onPlayAgainClicked));

    return container;
}

function scoreTable(scores: Score[]): HTMLElement {
    const table = document.createElement("table");
    table.style.fontSize = "0.5em";

    for (let entry of scores) {
        let row = document.createElement("tr")
        let cell1 = document.createElement("td")
        cell1.style.textAlign = "right";
        cell1.style.paddingRight = "1em";
        cell1.textContent = entry.username
        row.appendChild(cell1)
        let cell2 = document.createElement("td")
        cell2.style.textAlign = "left";
        cell2.textContent = entry.score.toString()
        row.appendChild(cell2)
        table.appendChild(row)
    }

    return table;
}

function offlineMessage(): HTMLElement {
    const elem = document.createElement("div");
    elem.textContent = "Pas de connexion";
    return elem;
}

function playAgainButton(onClick): HTMLElement {
    const button = document.createElement("button");
    button.style.flexBasis = "100px";
    button.style.flexShrink = "0";
    button.style.maxHeight = "20vh";
    button.style.borderRadius = "0";
    button.style.border = "none";
    button.style.backgroundColor = "#26b426";
    button.style.color = "white";
    button.style.fontSize = "30px";
    button.textContent = "REJOUER";
    button.addEventListener("click", onClick);
    return button;
}

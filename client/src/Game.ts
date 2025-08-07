import {
    BIRD_POSITION_X,
    BIRD_WIDTH,
    BIRD_HEIGHT,
    PIPE_WIDTH,
    PIPE_COUNT,
    PIPE_SPACING,
    PIPE_GAP,
    PIPE_MIN_HEIGHT,
    STARTING_GRACE,
    SCROLL_SPEED_START,
    GRAVITY,
    FLAP_DURATION,
    FLAP_SPEED,
    MAX_SPEED_UP,
    MAX_SPEED_DOWN,
    AIR_FRICTION, SCROLL_SPEED_MAX, SCROLL_SPEED_INCREMENT,
} from "./constants";

export default class {
    score = 0;
    is_lost = false;
    scroll_speed = SCROLL_SPEED_START;
    // position of the top left corner of the bird
    bird_position_y = 0.5 - BIRD_HEIGHT / 2;
    bird_speed_y = 0;

    // circular array of pipe coordinates
    leftmost_pipe_index = 0;
    pipe_positions_x = [];
    pipe_positions_y = [];
    pipe_counted_in_score = [];

    constructor() {
        for (let i = 0; i < PIPE_COUNT; i++) {
            this.pipe_positions_x.push(STARTING_GRACE + i * PIPE_SPACING)
            this.pipe_positions_y.push(this.__random_pipe())
            this.pipe_counted_in_score.push(false)
        }
    }

    update(elapsed: number) {
        let delta_t = Math.min(elapsed, 200) / 1000

        if (!this.is_lost) {
            this.__update_bird(delta_t)
            this.__update_pipes(delta_t)
            this.__check_bird_collision_with_pipe()
        }
    }

    __update_bird(delta_t) {
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
        this.bird_speed_y = -FLAP_SPEED
    }
}

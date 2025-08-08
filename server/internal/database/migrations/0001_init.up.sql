CREATE TABLE users
(
    username TEXT PRIMARY KEY NOT NULL CHECK ( length(username) > 0 )
) STRICT;

CREATE TABLE games
(
    username               TEXT    NOT NULL REFERENCES users (username),
    game_over_timestamp_ms INTEGER NOT NULL,
    score                  INTEGER NOT NULL,
    duration_ms            INTEGER NOT NULL,
    user_agent             TEXT    NOT NULL,
    -- TODO: add a server-side timestamp

    UNIQUE (username, game_over_timestamp_ms)
) STRICT;

CREATE INDEX IF NOT EXISTS idx_games_user_score ON games(username, score DESC);

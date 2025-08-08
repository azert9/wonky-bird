package protocol

type Score int64

type RecordedGames struct {
	Username string
	Games    []RecordedGame
}

type RecordedGame struct {
	Score               Score  `json:"score"`
	GameOverTimestampMS uint64 `json:"game_over_timestamp_ms"`
	GameDurationMS      uint64 `json:"game_duration_ms"`
}

type LeaderboardEntry struct {
	Username string `json:"username"`
	Score    Score  `json:"score"`
}

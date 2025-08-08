package database

import (
	"database/sql"
	"embed"
	"errors"
	"log"
	"path/filepath"
	"wonky-bird/internal/protocol"

	"github.com/golang-migrate/migrate/v4"
	sqlitemigrate "github.com/golang-migrate/migrate/v4/database/sqlite"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	_ "modernc.org/sqlite"
)

//go:embed migrations/*
var migrations embed.FS

type Database struct {
	sqlDB *sql.DB
}

type UsernameAndScore struct {
	Username string
	Score    protocol.Score
}

func Open(path string) (*Database, error) {

	// opening database

	dsn, err := filepath.Abs(path) // we do this so the path is not interpreted as an url
	if err != nil {
		return nil, err
	}

	// TODO: enforce foreign keys

	sqlDB, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}

	// applying migrations

	migrationsIOFS, err := iofs.New(migrations, "migrations")
	if err != nil {
		return nil, err
	}

	dbDriver, err := sqlitemigrate.WithInstance(sqlDB, &sqlitemigrate.Config{})
	if err != nil {
		return nil, err
	}

	m, err := migrate.NewWithInstance("iofs", migrationsIOFS, "sqlite", dbDriver)
	if err != nil {
		return nil, err
	}

	err = m.Up()
	if err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return nil, err
	}

	//

	db := &Database{sqlDB: sqlDB}

	return db, nil
}

func (db *Database) Close() error {
	return db.sqlDB.Close()
}

func (db *Database) PutUser(username string) error {

	_, err := db.sqlDB.Exec("INSERT INTO users (username) VALUES (?) ON CONFLICT DO NOTHING", username)
	if err != nil {
		return err
	}

	return nil
}

func (db *Database) PutGame(username string, game protocol.RecordedGame, userAgent string) error {

	_, err := db.sqlDB.Exec(
		"INSERT INTO games (username, game_over_timestamp_ms, score, duration_ms, user_agent) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING",
		username,
		game.GameOverTimestampMS,
		game.Score,
		game.DurationMS,
		userAgent,
	)
	if err != nil {
		return err
	}

	return nil
}

func (db *Database) GetLeaderboard(limit int) ([]UsernameAndScore, error) {

	rows, err := db.sqlDB.Query("SELECT username, max(score) AS best_score FROM games GROUP BY username ORDER BY best_score DESC LIMIT ?", limit)
	if err != nil {
		return nil, err
	}
	defer func(rows *sql.Rows) {
		err := rows.Close()
		if err != nil {
			log.Printf("error closing db cursor: %v", err)
		}
	}(rows)

	var scores []UsernameAndScore
	for rows.Next() {
		var username string
		var score protocol.Score
		err := rows.Scan(&username, &score)
		if err != nil {
			return nil, err
		}
		scores = append(scores, UsernameAndScore{
			Username: username,
			Score:    score,
		})
	}

	return scores, nil
}

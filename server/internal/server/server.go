package server

import (
	"errors"
	"regexp"
	"wonky-bird/internal/database"
	"wonky-bird/internal/protocol"
)

var UsernameRegex = regexp.MustCompile("^[a-zA-Z$@? ~#&/\"'éèàïù*€,.;:!_+-]{1,20}$")

type Server struct {
	db *database.Database
}

func NewServer(db *database.Database) (*Server, error) {
	return &Server{
		db: db,
	}, nil
}

func (srv *Server) PutGames(username string, userAgent string, games []protocol.RecordedGame) error {

	if !UsernameRegex.Match([]byte(username)) {
		return errors.New("username is not valid")
	}

	if err := srv.db.PutUser(username); err != nil {
		return err
	}

	for _, game := range games {
		if err := srv.db.PutGame(username, game, userAgent); err != nil {
			return err
		}
	}

	return nil
}

func (srv *Server) GetLeaderboard() ([]protocol.LeaderboardEntry, error) {

	scores, err := srv.db.GetLeaderboard(20)
	if err != nil {
		return nil, err
	}

	response := make([]protocol.LeaderboardEntry, len(scores))
	for i := range scores {
		response[i] = protocol.LeaderboardEntry{
			Username: scores[i].Username,
			Score:    scores[i].Score,
		}
	}

	return response, nil
}

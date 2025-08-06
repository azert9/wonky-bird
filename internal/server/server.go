package server

import (
	"errors"
	"wonky-bird/internal/database"
	"regexp"
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

func (srv *Server) PutScore(username string, score int) error {

	if !UsernameRegex.Match([]byte(username)) {
		return errors.New("username is not valid")
	}

	if score < 0 {
		return errors.New("score is negative")
	}

	err := srv.db.PutScore(username, score)
	if err != nil {
		return err
	}

	return nil
}

type UsernameAndScore struct {
	Username string `json:"username"`
	Score    int    `json:"score"`
}

func (srv *Server) GetLeaderboard() ([]UsernameAndScore, error) {

	scores, err := srv.db.GetLeaderboard(20)
	if err != nil {
		return nil, err
	}

	response := make([]UsernameAndScore, len(scores))
	for i := range scores {
		response[i] = UsernameAndScore {
			Username: scores[i].Username,
			Score: scores[i].Score,
		}
	}

	return response, nil
}

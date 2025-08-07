package database

import (
	"encoding/json"
	"os"
	"sort"
	"sync"
)

type Database struct {
	mutex sync.RWMutex
	path  string
}

type UsernameAndScore struct {
	Username string
	Score    int
}

func New(path string) (*Database, error) {

	db := &Database{path: path}

	data, err := db.load()
	if err != nil {
		return nil, err
	}

	err = db.save(data)
	if err != nil {
		return nil, err
	}

	return db, nil
}

func (d *Database) PutScore(username string, score int) error {

	d.mutex.Lock()
	defer d.mutex.Unlock()

	data, err := d.load()
	if err != nil {
		return err
	}

	if score > data[username] {
		data[username] = score
		err = d.save(data)
		if err != nil {
			return err
		}
	}

	return nil
}

func (d *Database) GetLeaderboard(limit int) ([]UsernameAndScore, error) {

	d.mutex.RLock()
	defer d.mutex.RUnlock()

	data, err := d.load()
	if err != nil {
		return nil, err
	}

	scores := make([]UsernameAndScore, 0, len(data))
	for username, score := range data {
		scores = append(scores, UsernameAndScore{
			Username: username,
			Score:    score,
		})
	}

	sort.Slice(scores, func(i, j int) bool {
		return scores[i].Score > scores[j].Score
	})

	if limit > 0 && limit < len(scores) {
		scores = scores[:limit]
	}

	return scores, nil
}

func (d *Database) load() (map[string]int, error) {

	dataBytes, err := os.ReadFile(d.path)
	if err != nil {
		if os.IsNotExist(err) {
			return make(map[string]int), nil
		}
		return nil, err
	}

	var data map[string]int
	err = json.Unmarshal(dataBytes, &data)
	if err != nil {
		return nil, err
	}

	return data, nil
}

func (d *Database) save(data map[string]int) error {

	dataBytes, err := json.Marshal(data)
	if err != nil {
		return err
	}

	err = os.WriteFile(d.path, dataBytes, 0644)
	if err != nil {
		return err
	}

	return nil
}

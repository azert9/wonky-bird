package main

import (
	"encoding/json"
	"wonky-bird/internal/client"
	"wonky-bird/internal/database"
	"wonky-bird/internal/server"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
)

var srv *server.Server

func getRoot(w http.ResponseWriter, r *http.Request) {

	content, err := client.Files.ReadFile("index.html")
	if err != nil {
		// TODO
	}

	_, err = w.Write(content)
	if err != nil {
		// TODO
	}
}

func getStatic(w http.ResponseWriter, r *http.Request) {

	path := r.URL.Path[len("/static/"):]

	content, err := client.Files.ReadFile(path)
	if err != nil {
		// TODO
	}

	if strings.HasSuffix(path, ".js") {
		w.Header().Set("Content-Type", "application/javascript")
	}

	_, err = w.Write(content)
	if err != nil {
		// TODO
	}
}

func getApi(w http.ResponseWriter, r *http.Request) {

	path := r.URL.Path[len("/api/"):]

	if path == "leaderboard" {

		if r.Method != http.MethodGet {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		scores, err := srv.GetLeaderboard()
		if err != nil {
			panic(err) // TODO
		}

		response, err := json.Marshal(scores)
		if err != nil {
			panic(err) // TODO
		}

		if _, err := w.Write(response); err != nil {
			panic(err) // TODO
		}

	} else if path == "score" {

		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		requestBody, err := io.ReadAll(r.Body)
		if err != nil {
			w.WriteHeader(500)
			return
		}

		type Request struct {
			Username string `json:"username"`
			Score    int    `json:"score"`
		}

		var requestBodyDecoded Request
		if err := json.Unmarshal(requestBody, &requestBodyDecoded); err != nil {
			w.WriteHeader(400)
			return
		}

		log.Printf("score submitted by player %q: %d", requestBodyDecoded.Username, requestBodyDecoded.Score)

		err = srv.PutScore(requestBodyDecoded.Username, requestBodyDecoded.Score)
		if err != nil {
			w.WriteHeader(500)
			return
		}

	} else {
		w.WriteHeader(404)
	}
}

func mustGetEnv(key string) string {
	value := os.Getenv(key)
	if value == "" {
		log.Fatalf("Environment variable unset or empty: %s", key)
	}
	return value
}

func main() {
	var err error

	listenAddress := mustGetEnv("LISTEN_ADDRESS")
	dbPath := mustGetEnv("DB_PATH")

	db, err := database.New(dbPath)
	if err != nil {
		panic(err)
	}

	srv, err = server.NewServer(db)
	if err != nil {
		panic(err)
	}

	http.HandleFunc("/", getRoot)
	http.HandleFunc("/static/", getStatic)
	http.HandleFunc("/api/", getApi)

	log.Printf("listening on %s", listenAddress)

	err = http.ListenAndServe(listenAddress, nil)
	if err != nil {
		panic(err)
	}
}

package main

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"wonky-bird/internal/database"
	"wonky-bird/internal/server"
)

func handleApiRequest(srv *server.Server, w http.ResponseWriter, r *http.Request) {

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
	webRoot := os.Getenv("WEB_ROOT")

	// preparing api server

	db, err := database.New(dbPath)
	if err != nil {
		panic(err)
	}

	srv, err := server.NewServer(db)
	if err != nil {
		panic(err)
	}

	http.HandleFunc("/api/", func(w http.ResponseWriter, r *http.Request) {
		handleApiRequest(srv, w, r)
	})

	// preparing static server

	if webRoot != "" {
		webRootFS := http.Dir(webRoot)
		http.Handle("/", http.FileServer(webRootFS))
	} else {
		log.Printf("static files disabled, api only")
	}

	// running server

	log.Printf("listening on %s", listenAddress)

	err = http.ListenAndServe(listenAddress, nil)
	if err != nil {
		panic(err)
	}
}

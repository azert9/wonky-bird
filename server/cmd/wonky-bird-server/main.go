package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"wonky-bird/internal/database"
	"wonky-bird/internal/protocol"
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

	} else if path == "games" {

		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		var requestBody protocol.RecordedGames
		err := json.NewDecoder(r.Body).Decode(&requestBody)
		if err != nil {
			w.WriteHeader(400)
			return
		}

		userAgent := r.Header.Get("User-Agent")

		err = srv.PutGames(requestBody.Username, userAgent, requestBody.Games)
		if err != nil {
			// TODO: can be a 400
			log.Printf("error putting games: %v", err)
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
	clientURL := os.Getenv("CLIENT_URL")

	// preparing api server

	db, err := database.Open(dbPath)
	if err != nil {
		panic(err)
	}
	defer func() {
		err := db.Close()
		if err != nil {
			log.Printf("error closing database: %v", err)
		}
	}()

	srv, err := server.NewServer(db)
	if err != nil {
		panic(err)
	}

	http.HandleFunc("/api/", func(w http.ResponseWriter, r *http.Request) {
		if clientURL != "" {
			w.Header().Set("Access-Control-Allow-Origin", clientURL)
			w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		}
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

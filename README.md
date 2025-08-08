## Release Build

```shell
docker build -t wonky-bird .
```

## Running Locally

Client:

```shell
cd client
npm install
API_URL=http://localhost:8000 npm run start
```

Server:

```shell
cd server
# your CLIENT_URL might be different
LISTEN_ADDRESS=localhost:8000 DB_PATH=/tmp/wonky-bird.json CLIENT_URL=http://localhost:1234 go run ./cmd/wonky-bird-server
```

## TODO

* Permettre un appui long pour sauter plus haut ?

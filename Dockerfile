FROM node:24 AS build-client

COPY ./client /build

RUN cd /build \
 && npm install \
 && npm run build


FROM golang:1 AS build-server

COPY ./server /build

RUN cd /build \
 && CGO_ENABLED=0 go build ./cmd/wonky-bird-server


FROM scratch

COPY --from=build-client /build/dist /static

COPY --from=build-server /build/wonky-bird-server /

ENV LISTEN_ADDRESS=0.0.0.0:8000
ENV DB_PATH=/data/db.json
ENV WEB_ROOT=/static

# TODO: run as non-root
ENTRYPOINT ["/wonky-bird-server"]

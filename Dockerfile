FROM golang:1 AS build

COPY . /build

RUN cd /build && CGO_ENABLED=0 go build ./cmd/wonky-bird-server


FROM scratch

# TODO: run as non-root

COPY --from=build /build/wonky-bird-server /

ENTRYPOINT ["/wonky-bird-server"]

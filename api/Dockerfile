FROM golang:1.23.6-alpine3.21

WORKDIR /usr/src/app

# Install git (needed for go install), bash (for air), and deps
RUN apk add --no-cache git bash

# Install only air for hot reload
RUN go install github.com/air-verse/air@v1.61.7

COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Optional prebuild for caching or release
# RUN go build -o main .

EXPOSE 4003

CMD ["air", "-c", ".air.toml"]

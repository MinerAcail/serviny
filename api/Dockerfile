# Use the latest stable Golang Alpine image
FROM golang:1.23.6-alpine3.21

# Set the current working directory inside the container
WORKDIR /usr/src/app

# Install CompileDaemon
RUN go install github.com/air-verse/air@v1.61.7
# RUN go install github.com/githubnemo/CompileDaemon@v1.4.0

# Copy go.mod and go.sum first for caching
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the rest of the application
COPY . .

# Ensure the binary is built before running
RUN go build -o main .

# Expose the application port
EXPOSE 4003


CMD ["air", "-c", ".air.toml"]
# Run the application with hot reloading
# CMD ["CompileDaemon", "--build=go build -o main .", "--command=./main"]

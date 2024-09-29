package main

import (
	"github.com/joho/godotenv"
	"radio-streaming/internal/server"
)

func main() {
	// Start the server
	godotenv.Load()

	server.StartServer()


	//This feels very empty
}

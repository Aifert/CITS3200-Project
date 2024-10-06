// HTTP server that streams audio to connected clients.
// It handles audio streaming from specified files or radio frequencies and manages client connections.
//
// The server provides two main endpoints:
// - /stream: Clients can connect to this endpoint to receive audio streams.
// - /tune: Clients can use this endpoint to change the frequency or file being streamed.
package server

import (
	"fmt"
	"net/http"
	"sync"
	"radio-streaming/internal/pool"
	"radio-streaming/internal/stream"
	"log"
)

// Holds the path of a currently streaming audio file.
var currentFile string
var fileMutex sync.Mutex

// Initializes and starts the HTTP server on port 4001.
func StartServer() {
	// Initialize connection pool
	connPool := pool.NewConnectionPool()

	// Define HTTP handlers
	http.HandleFunc("/stream", AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		StreamHandler(w, r, connPool)
	}))
	http.HandleFunc("/tune", AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		TuneHandler(w, r, connPool)
	}))

	// Start the server
	fmt.Println("Starting server on :4001")
	http.ListenAndServe(":4001", nil)
}

// Manages client connections for streaming audio.
// Adapted from https://github.com/Icelain/radio/
func StreamHandler(w http.ResponseWriter, r *http.Request, connPool *pool.ConnectionPool) {
	clientChan := make(chan []byte)
	connPool.AddConnection(clientChan)
	defer connPool.DeleteConnection(clientChan)

	w.Header().Set("Content-Type", "audio/mpeg")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		log.Println("Could not create flusher")
	}

	bufferChannel := make(chan []byte)
	connPool.AddConnection(bufferChannel)
	log.Printf("%s has connected\n", r.Host)

	for {
		buf := <-bufferChannel
		if _, err := w.Write(buf); err != nil {
			connPool.DeleteConnection(bufferChannel)
			log.Printf("%s's connection has been closed\n", r.Host)
			return
		}
		flusher.Flush()
	}
}

// Allows clients to change the audio source being streamed.
// Usage [Address]:4001/tune?["file=blahblah" OR "freq=blahblah"]
func TuneHandler(w http.ResponseWriter, r *http.Request, connPool *pool.ConnectionPool) {
	file := r.URL.Query().Get("file")
	freq := r.URL.Query().Get("freq")

	if file != "" {
		// Change the file being streamed
		fileMutex.Lock()
		currentFile = "pkg/audio/" + file  // Update the current file
		fileMutex.Unlock()

		// Re-stream the new file to all clients
		go stream.StreamFile(connPool, currentFile)
	} else if freq != "" {
		// Placeholder for radio streaming
		fmt.Fprintf(w, "Tuning to frequency: %s", freq)
	} else {
		http.Error(w, "Invalid parameters", http.StatusBadRequest)
	}
}
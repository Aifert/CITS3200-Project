// HTTP server that streams audio to connected clients.
// It handles audio streaming from specified files or radio frequencies and manages client connections.
//
// The server provides two main endpoints:
// - /stream: Clients can connect to this endpoint to receive audio streams.
// - /tune: Clients can use this endpoint to change the frequency or file being streamed.
package server

import (
	"fmt"
	"math/rand"
	"net/http"
	"sync"
	"radio-streaming/internal/pool"
	"radio-streaming/internal/stream"
	"radio-streaming/internal/monitor"
	"log"
)

// Holds the path of a currently streaming audio file.
var currentFile string
var fileMutex sync.Mutex


// Holds the info of a rtl_fm service
var monitoringService *monitor.MonitoringService



// Initializes and starts the HTTP server on port 4001.
func StartServer() {
	// Initialize connection pool
	connPool := pool.NewConnectionPool()
	freqStore := 0

	// Define HTTP handlers
	http.HandleFunc("/stream", func(w http.ResponseWriter, r *http.Request) {
		StreamHandler(w, r, connPool)
	})

	http.HandleFunc("/tune", func(w http.ResponseWriter, r *http.Request) {
		TuneHandler(w, r, connPool, &freqStore)
	})

	http.HandleFunc("/stop", func(w http.ResponseWriter, r *http.Request) {
		StopHandler(w, r, connPool);
	})

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
func TuneHandler(w http.ResponseWriter, r *http.Request, connPool *pool.ConnectionPool, freqStore *int) {
	file := r.URL.Query().Get("file")
	freq := r.URL.Query().Get("freq")

	if file != "" {
		// Change the file being streamed
		fileMutex.Lock()
		currentFile = "pkg/audio/" + file  // Update the current file
		fileMutex.Unlock()
		*freqStore = rand.Int()
		// Re-stream the new file to all clients
		go stream.StreamFile(connPool, freqStore, currentFile, currentFile)
	} else if freq != "" {
		// Placeholder for radio streaming
		fmt.Fprintf(w, "Tuning to frequency: %s", freq)

		if monitoringService != nil {
			if err := monitor.StopRadioMonitoring(monitoringService); err != nil {
				fmt.Println("Error stopping monitoring service:", err)
			}
			monitoringService = nil
		}

		var err error
		*freqStore = rand.Int()
		monitoringService, err = monitor.StartRadioMonitoring(freq, *freqStore)
		if err != nil {
			fmt.Println("Error starting monitoring service:", err)
		}

		// Simulate some work
		fmt.Println("Monitoring...")

		go stream.StreamFrequency(connPool, freqStore);



	} else {
		http.Error(w, "Invalid parameters", http.StatusBadRequest)
	}
}

// Allows clients to make a stop monitoring on a device
func StopHandler(w http.ResponseWriter, r *http.Request, connPool *pool.ConnectionPool){
	if monitoringService != nil {
		if err := monitor.StopRadioMonitoring(monitoringService); err != nil {
			fmt.Println("Error stopping monitoring service:", err)
		} else {
			fmt.Println("Monitoring service stopped")
		}
		monitoringService = nil

	}
}

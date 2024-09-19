package main

import (
	"fmt"
	"net/http"
)

func main() {
	// Endpoint for listening into an audio stream
	http.HandleFunc("/stream", streamHandler)

	// Endpoint for tuning the radio to a new frequency
	http.HandleFunc("/tune", tuneHandler)



	// Start server on port 8080
	fmt.Println("Starting server on :8001")
	http.ListenAndServe(":8001", nil)
}

// Placeholder for stream handler
func streamHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "Streaming audio...")
}


// Placeholder handler for tune requests.
// Clients can pass the desired frequency as a query parameter (e.g., GET /tune?freq=88.5M)

func tuneHandler(w http.ResponseWriter, r *http.Request) {
	freq := r.URL.Query().Get("freq")
	if freq == "" {
		http.Error(w, "Frequency not specified", http.StatusBadRequest)
		return
	}
	fmt.Fprintf(w, "Tuned to frequency: %s", freq)
}

// Provides a thread-safe connection pool for managing
// multiple audio stream clients and broadcasting audio data to them.
//
// Allows multiple clients to connect and receive
// audio data concurrently.
//
// Adapted from: https://ice.computer/blog/realtime-http-audio-streaming-server-in-go
package pool

import "sync"

// Manages a collection of client connections for broadcasting audio data.
type ConnectionPool struct {
	bufferChannelMap map[chan []byte]struct{} // Map of channels representing client connections
	mu               sync.Mutex                // Mutex for synchronizing access to the connection pool
}

// Adds a new client connection to the pool.
func (cp *ConnectionPool) AddConnection(bufferChannel chan []byte) {
	defer cp.mu.Unlock()
	cp.mu.Lock()

	cp.bufferChannelMap[bufferChannel] = struct{}{}
}

// Removes a client connection from the pool.
func (cp *ConnectionPool) DeleteConnection(bufferChannel chan []byte) {
	defer cp.mu.Unlock()
	cp.mu.Lock()

	delete(cp.bufferChannelMap, bufferChannel)
}

// Sends a copy of the provided audio buffer to all connected clients.
func (cp *ConnectionPool) Broadcast(buffer []byte) {
	defer cp.mu.Unlock()
	cp.mu.Lock()

	for bufferChannel := range cp.bufferChannelMap {
		clonedBuffer := make([]byte, len(buffer)) // Create a new buffer to prevent data races
		copy(clonedBuffer, buffer)

		select {
			case bufferChannel <- clonedBuffer:
				// Successfully sent to the client
			default:
				// Optionally log or handle dropped messages here
		}
	}
}

// Initializes and returns a new ConnectionPool instance.
func NewConnectionPool() *ConnectionPool {
	bufferChannelMap := make(map[chan []byte]struct{})
	return &ConnectionPool{bufferChannelMap: bufferChannelMap}
}

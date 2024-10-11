package stream

import (
	"github.com/hajimehoshi/go-mp3"
	"io"
	"os"
	"log"
	"time"
	//"os/exec"
	"radio-streaming/internal/pool"
	"bytes"
)

const BUFFERSIZE = 8192

// Continuously reads audio data from the provided content and broadcasts it to all clients
//
// Adapted from https://github.com/Icelain/radio/blob/main/main.go
func stream(connectionPool *pool.ConnectionPool, content []byte, delay time.Duration) {

	buffer := make([]byte, BUFFERSIZE)

	for {
		buffer = make([]byte, BUFFERSIZE)
		tempfile := bytes.NewReader(content)
		ticker := time.NewTicker(delay)

		for range ticker.C {

			_, err := tempfile.Read(buffer)

			if err == io.EOF {

				ticker.Stop()
				break

			}

			connectionPool.Broadcast(buffer)

		}

	}

}

// Calculates the delay based on sample rate of MP3 file
func CalculateDelayForMP3(filePath string) (time.Duration, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return 0, err
	}
	defer file.Close()

	decoder, err := mp3.NewDecoder(file)
	if err != nil {
		log.Printf("Error decoding file: %v", err)
		return 0, err
	}

	// Get the sample rate from the decoder
	sampleRate := decoder.SampleRate()
	log.Printf("File Samplerate: %v", sampleRate)

	// Calculate the delay using the sample rate and buffer size
	delay := time.Duration(BUFFERSIZE) * time.Second / time.Duration(sampleRate)
	log.Printf("Calculated delay: %v", delay) // Log delay for debugging

	log.Printf("Adjusted delay: %v", delay)
	return delay, nil
}

// Logic for streaming a file to clients
func StreamFile(cp *pool.ConnectionPool, filePath string) {
	// Calculate the delay
	delay, err := CalculateDelayForMP3(filePath)
	if err != nil {
		log.Printf("Error reading sample rate: %v", err)
		return
	}

	// Read the entire file content
	file, err := os.Open(filePath)
	if err != nil {
		log.Printf("Error opening file: %v", err)
		return
	}
	defer file.Close()

	ctn, err := io.ReadAll(file)
	if err != nil {
		log.Fatal(err)
	}

	go stream(cp, ctn, delay)
}

// Logic for streaming a frequency to clients
func StreamFrequency(cp *pool.ConnectionPool, frequency string) {
	// TODO: Not yet implemented
}


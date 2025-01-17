package stream

import (
	//"github.com/hajimehoshi/go-mp3"
	"io"
	"os"
	"log"
	"time"
	"fmt"
	"strconv"
	//"os/exec"
	"radio-streaming/internal/pool"
)

const BUFFERSIZE = 8192

// WaitForFileSize waits for a file to reach at least sizeLimit within the timeout period.
// If the file size doesn't grow within the timeout, it returns an error.
func WaitForFileSize(filePath string, sizeLimit int64, timeout time.Duration) error {
    ticker := time.NewTicker(500 * time.Millisecond) // Check file size every 500ms
    defer ticker.Stop()

    timeoutChan := time.After(timeout)
    
    for {
        select {
        case <-ticker.C:
            fileInfo, err := os.Stat(filePath)
            if err != nil {
                return fmt.Errorf("failed to stat file: %v", err)
            }

            if fileInfo.Size() >= sizeLimit {
                return nil // File has reached the desired size
            }

        case <-timeoutChan:
            return fmt.Errorf("file did not reach %d bytes within the timeout period", sizeLimit)
        }
    }
}

// Continuously reads audio data from the provided content and broadcasts it to all clients
//
// Adapted from https://github.com/Icelain/radio/blob/main/main.go
func stream(connectionPool *pool.ConnectionPool, freq *int, filePath string, delay time.Duration) {
    buffer := make([]byte, BUFFERSIZE)
    thisStreamFreq := *freq
    fmt.Println("starting streaming again")

    for {
        if *freq != thisStreamFreq {
			fmt.Println("starting new, closing old")
            return
        }
        file, err := os.Open(filePath)
        if err != nil {
            log.Printf("Error opening file: %v", err)
            return
        }
        defer file.Close()



        ticker := time.NewTicker(delay)
        defer ticker.Stop()

        for range ticker.C {
            if *freq != thisStreamFreq {
				fmt.Println("starting new, closing old")
                return
            }   
            // Read data in chunks
            n, err := file.Read(buffer)
            if err == io.EOF {
                // If EOF is reached, wait for more data
                continue
            } else if err != nil {
                log.Printf("Error reading file: %v", err)
                return
            }

            // Broadcast the new chunk of data to the clients
            connectionPool.Broadcast(buffer[:n])
        }
    }
}

// Calculates the delay based on sample rate of MP3 file
func CalculateDelayForMP3(filePath string) (time.Duration, error) {
	sampleRate := 22050
	log.Printf("File Samplerate: %v", sampleRate)

	// Calculate the delay using the sample rate and buffer size
	delay := time.Duration(BUFFERSIZE) * time.Second / time.Duration(sampleRate)
	log.Printf("Calculated delay: %v", delay) // Log delay for debugging

	log.Printf("Adjusted delay: %v", delay)
	return delay, nil
}

// Logic for streaming a file to clients
func StreamFile(cp *pool.ConnectionPool, freq *int, filePath string, delayPath string) {
    // Calculate the delay
    delay, err := CalculateDelayForMP3(delayPath)
    if err != nil {
        log.Printf("Error reading sample rate: %v", err)
        return
    }

    // Stream the file content
    go stream(cp, freq, filePath, delay)
}

// Logic for streaming a frequency to clients
func StreamFrequency(cp *pool.ConnectionPool, freq *int) {
	StreamFile(cp, freq, "pkg/audio/stream"+strconv.Itoa(*freq)+".mp3", "pkg/audio/stream"+strconv.Itoa(*freq)+".mp3");
}


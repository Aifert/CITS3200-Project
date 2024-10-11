package monitor

import (
	"fmt"
	"os"
	"os/exec"
	"log"
)

type MonitoringService struct {
	RtlFmCmd   *exec.Cmd
	FFmpegCmd  *exec.Cmd
	OutputFile string
}

// startRadioMonitoring starts the rtl_fm process at the given frequency,
func StartRadioMonitoring(frequency string) (*MonitoringService, error) {
	// Generate the output file path
	outputFile := fmt.Sprintf("./pkg/audio/stream.mp3")

	// Create or truncate the output file
	file, err := os.Create(outputFile)
	if err != nil {
		return nil, fmt.Errorf("failed to create output file: %w", err)
	}

	// Prepare the rtl_fm command with the given frequency
	rtlFmCmd := exec.Command(
		"rtl_fm",
		"-f", frequency,
		"-M", "fm",
		"-s", "44100", // Sample rate
		"-g", "20",    // Gain (adjust as needed)
		"-d", "1",
		"-M", "fm" 
	)

	// Prepare the ffmpeg command to encode raw audio to MP3
	ffmpegCmd := exec.Command(
		"ffmpeg",
		"-f", "s16le",           // Input format: 16-bit little-endian PCM
		"-ar", "44100",          // Input sample rate
		"-ac", "1",              // Number of audio channels
		"-i", "pipe:0",          // Input from stdin
		"-codec:a", "libmp3lame", // Audio codec
		"-b:a", "128k",          // Audio bitrate
		"-f", "mp3",             // Output format
		"-write_xing", "0",      // Do not write Xing header
		"-id3v2_version", "0",   // Do not write ID3v2 tags
		"-",                     // Output to stdout
	)

	// Pipe rtl_fm output to ffmpeg input
	rtlFmStdout, err := rtlFmCmd.StdoutPipe()
	if err != nil {
		file.Close()
		return nil, fmt.Errorf("failed to get rtl_fm stdout: %w", err)
	}
	ffmpegCmd.Stdin = rtlFmStdout

	// Set ffmpeg output to the file
	ffmpegCmd.Stdout = file

	// Start rtl_fm command
	if err := rtlFmCmd.Start(); err != nil {
		file.Close()
		return nil, fmt.Errorf("failed to start rtl_fm: %w", err)
	}

	// Start ffmpeg command
	if err := ffmpegCmd.Start(); err != nil {
		file.Close()
		rtlFmCmd.Process.Kill()
		rtlFmCmd.Wait()
		return nil, fmt.Errorf("failed to start ffmpeg: %w", err)
	}

	// Store the commands and output file path in the MonitoringService
	service := &MonitoringService{
		RtlFmCmd:   rtlFmCmd,
		FFmpegCmd:  ffmpegCmd,
		OutputFile: outputFile,
	}

	return service, nil
}

// Stops the rtl_fm and ffmpeg processes.
func StopRadioMonitoring(service *MonitoringService) error {
    var err error

    // Terminate the ffmpeg process gracefully
    if service.FFmpegCmd != nil && service.FFmpegCmd.Process != nil {
        // Wait for ffmpeg process to exit
        if killErr := service.FFmpegCmd.Process.Kill(); killErr != nil {
		log.Printf("Failed to forcefully kill ffmpeg process: %v", killErr)
		return fmt.Errorf("failed to kill ffmpeg process: %w", err)
	}
    }

    // Terminate the rtl_fm process
    if service.RtlFmCmd != nil && service.RtlFmCmd.Process != nil {
	if killErr := service.RtlFmCmd.Process.Kill(); killErr != nil {
		log.Printf("Failed to forcefully kill rtl_fm process: %v", killErr)
		return fmt.Errorf("failed to kill rtl_fm process: %w", err)
	}
    }

    return nil
}

package monitor

import (
	"fmt"
	"os"
	"os/exec"
	"log"
)

type MonitoringService struct {
	RtlFmCmd   *exec.Cmd
	FFmpegCmdOutput  *exec.Cmd
	FFmpegCmdDelay  *exec.Cmd
	OutputFile string
	DelayFile string
}

// startRadioMonitoring starts the rtl_fm process at the given frequency,
func StartRadioMonitoring(frequency string) (*MonitoringService, error) {
	// Generate the output file path
	outputFile := fmt.Sprintf("./pkg/audio/stream.mp3")
	delayFile := fmt.Sprintf("./pkg/audio/delaystream.mp3")

	// Create or truncate the output file
	oFile, err := os.Create(outputFile)
	if err != nil {
		return nil, fmt.Errorf("failed to create output file: %w", err)
	}

	dFile, err := os.Create(delayFile)
	if err != nil {
		return nil, fmt.Errorf("failed to create output file: %w", err)
	}

	// Prepare the rtl_fm command with the given frequency
	rtlFmCmd := exec.Command(
		"rtl_fm",
		"-f", frequency,
		"-M", "fm",
		"-s", "22050", // Sample rate
		"-g", "1",    // Gain (adjust as needed)
		"-d", "1", //TODO: Add device specifier later when 2 devices are availible
		"-l", "3",
	)

	// Prepare the ffmpeg command to encode raw audio to MP3
	ffmpegCmdDelay := exec.Command(
		"ffmpeg",
		"-f", "s16le",           // Input format: 16-bit little-endian PCM
		"-ar", "22050",          // Input sample rate
		"-ac", "1",              // Number of audio channels
		"-i", "pipe:0",          // Input from stdin
		"-codec:a", "libmp3lame", // Audio codec
		"-b:a", "128k",          // Audio bitrate
		"-f", "mp3",             // Output format
		"-write_xing", "0",      // Do not write Xing header
		"-id3v2_version", "0",   // Do not write ID3v2 tags
		"-",                     // Output to stdout
	)

	ffmpegCmdOutput := exec.Command(
		"ffmpeg",
		"-f", "s16le",           // Input format: 16-bit little-endian PCM
		"-ar", "22050",          // Input sample rate
		"-ac", "1",              // Number of audio channels
		"-af", "afftdn",		 // Apply Fast Fourier Transform to filter white noise
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
		oFile.Close()
		dFile.Close()
		return nil, fmt.Errorf("failed to get rtl_fm stdout: %w", err)
	}
	ffmpegCmdDelay.Stdin = rtlFmStdout
	ffmpegCmdOutput.Stdin = rtlFmStdout

	// Set ffmpeg output to the file
	ffmpegCmdDelay.Stdout = dFile
	ffmpegCmdOutput.Stdout = oFile

	// Start rtl_fm command
	if err := rtlFmCmd.Start(); err != nil {
		dFile.Close()
		oFile.Close()
		return nil, fmt.Errorf("failed to start rtl_fm: %w", err)
	}

	// Start ffmpeg command
	if err := ffmpegCmdDelay.Start(); err != nil {
		dFile.Close()
		oFile.Close()
		rtlFmCmd.Process.Kill()
		rtlFmCmd.Wait()
		return nil, fmt.Errorf("failed to start ffmpeg: %w", err)
	}

	if err := ffmpegCmdOutput.Start(); err != nil {
		dFile.Close()
		oFile.Close()
		rtlFmCmd.Process.Kill()
		ffmpegCmdDelay.Process.Kill()
		rtlFmCmd.Wait()
		return nil, fmt.Errorf("failed to start ffmpeg: %w", err)
	}

	// Store the commands and output file path in the MonitoringService
	service := &MonitoringService{
		RtlFmCmd:   rtlFmCmd,
		FFmpegCmdOutput:  ffmpegCmdOutput,
		FFmpegCmdDelay:  ffmpegCmdDelay,
		OutputFile: outputFile,
		DelayFile: delayFile,
	}

	return service, nil
}

// Stops the rtl_fm and ffmpeg processes.
func StopRadioMonitoring(service *MonitoringService) error {
    var err error

    // Terminate the ffmpeg process gracefully
    if service.FFmpegCmdOutput != nil && service.FFmpegCmdOutput.Process != nil {
        // Wait for ffmpeg process to exit
        if killErr := service.FFmpegCmdOutput.Process.Kill(); killErr != nil {
			log.Printf("Failed to forcefully kill ffmpeg process: %v", killErr)
			return fmt.Errorf("failed to kill ffmpeg process: %w", err)
		}
    }

    if service.FFmpegCmdDelay != nil && service.FFmpegCmdDelay.Process != nil {
        // Wait for ffmpeg process to exit
        if killErr := service.FFmpegCmdDelay.Process.Kill(); killErr != nil {
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

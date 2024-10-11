# Go Radio Streaming Service

This project implements a Go-based radio streaming service that can stream both MP3 files and live radio frequencies using rtl_fm. Clients can connect to the stream via HTTP to listen in real time.

## Features
 - Stream MP3 files to multiple clients over HTTP.
 - Stream live radio frequencies using rtl_fm.
 - Dynamically calculate delays for smooth streaming based on the file or stream sample rate.

## Setup

1. Install Dependencies:
```bash
go mod tidy
sudo apt install rtl-sdr # For Debian/Ubuntu
sudo pacman -S rtl-sdr # For Arch
```

2. Build the application
```bash
go build ./cmd/main.go
```
3. Run the server
```bash
./main
```

## Usage
1. Stream MP3 File:
 - Tune to an MP3 file by navigating to /tune?file=yourfile.mp3
 - Listen to the stream at /stream

2. Stream Radio Frequency: (Not yet implemented)
 - Tune to a frequency by navigating to /tune?freq=(yourfrequency)
 - Listen to the stream at /stream

## Dependencies

- rtl_fm: Required for streaming live radio frequencies.
- go-mp3: Used for decoding MP3 files and retrieving the sample rate.

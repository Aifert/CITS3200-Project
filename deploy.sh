#!/bin/bash

# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker dependencies if not already installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker and Docker Compose..."
    sudo apt install -y docker.io docker-compose
else
    echo "Docker and Docker Compose are already installed."
fi

# Install Go if not already installed
if ! command -v go &> /dev/null; then
    echo "Installing Go..."
    sudo apt install -y golang-go
else
    echo "Go is already installed."
fi

# Install rtl-sdr if not already installed
if ! dpkg -l | grep -q rtl-sdr; then
    echo "Installing rtl-sdr..."
    sudo apt install -y rtl-sdr
else
    echo "rtl-sdr is already installed."
fi

# Install npm if not already installed
if ! command -v npm &> /dev/null; then
    echo "Installing npm..."
    sudo apt install -y npm
else
    echo "npm is already installed."
fi

# Install pm2 globally if not already installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing pm2..."
    sudo npm i -g pm2
else
    echo "pm2 is already installed."
fi

# Build and run Docker containers
echo "Building Docker containers..."
sudo docker-compose build --no-cache

echo "Starting Docker containers..."
sudo docker-compose up -d

# Set up Go Radio Streaming Service
echo "Setting up Go Radio Streaming Service..."
cd rasp-pi/radio-streaming  # Adjust this path if necessary
go mod tidy
go build ./cmd/main.go

# Start the Go Radio Streaming Service with pm2 if not already running
if ! pm2 list | grep -q "go-radio-streaming"; then
    echo "Starting Go Radio Streaming Service..."
    pm2 start main --name "go-radio-streaming"
else
    echo "Go Radio Streaming Service is already running."
fi

# Set up and start the deployment server
echo "Setting up deployment server..."
cd ../../deploy && npm i

if ! pm2 list | grep -q "deploy"; then
    echo "Starting deployment server..."
    pm2 start deploy.js --name "deploy-server"
else
    echo "Deployment server is already running."
fi

echo "Deployment completed. Go Radio Streaming Service and other components are now running."

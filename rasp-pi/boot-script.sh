#!/bin/bash

# CREATE NECESSARY DIRECTORIES
mkdir -p /mnt/usb

# MOUNT THE USB WITH config.txt ON IT
mount_usb() {
    for device in /dev/sd*1; do
        if [ -b "$device" ]; then
            mount "$device" /mnt/usb
            if [ -f "/mnt/usb/config.txt" ]; then
                echo "Config file found on $device"
                return 0
            else
                umount /mnt/usb
            fi
        fi
    done
    return 1
}

# READ AND PRINT config.txt
read_config() {
    local config_file="$1"
    echo "Contents of $config_file:"
    cat "$config_file"
    echo "---End of config file---"
    #read the file into an array
    mapfile -t lines < "$config_file"
    #process each line
    for line in "${lines[@]}"; do
        #skip empty lines & comments (lines starting with #)
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        #split the line into key & value pairs
        IFS='=' read -r key value <<< "$line"
        #trim whitespace because humans think spaces don't matter
        key=$(echo "$key" | xargs)
        value=$(echo "$value" | xargs)
        #replace dots with underscores in keys because dots are computer speak
        key=$(echo "$key" | tr '.' '_')
        #create the variable
        eval "${key}='${value}'"
        echo "Loaded: $key = $value"
    done
}

# MAIN EXECUTION
if mount_usb; then
    read_config "/mnt/usb/config.txt"
    
    #print some values to verify it's working
    echo "Network Name: $network_name"
    echo "Server Address: $server_address"
    echo "API Key: $api_key"
    echo "Targeting VHF: $targeting_VHF"
    echo "K value: $k"
else
    echo "No USB drive with config.txt found"
fi
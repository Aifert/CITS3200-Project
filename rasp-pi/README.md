# System on Chip Documentation
## RTL-SDR v4 DRIVERS (current as of 4/9/2024)
Linux (Debian), Raspberry Pi OS, Ubuntu

Purge any previous rtl-sdr drivers:

	sudo apt purge ^librtlsdr
	sudo rm -rvf /usr/lib/librtlsdr* /usr/include/rtl-sdr* /usr/local/lib/librtlsdr* /usr/local/include/rtl-sdr* /usr/local/include/rtl_* /usr/local/bin/rtl_*

Install the RTL-SDR Blog drivers:

	sudo apt-get install libusb-1.0-0-dev git cmake pkg-config
	git clone https://github.com/rtlsdrblog/rtl-sdr-blog
	cd rtl-sdr-blog
	mkdir build
	cd build
	cmake ../ -DINSTALL_UDEV_RULES=ON
	make
	sudo make install
	sudo cp ../rtl-sdr.rules /etc/udev/rules.d/
	sudo ldconfig

Blacklist the DVB-T TV drivers.

	echo 'blacklist dvb_usb_rtl28xxu' | sudo tee --append /etc/modprobe.d/blacklist-dvb_usb_rtl28xxu.conf

Reboot

After it boots up again run `rtl_test` at the terminal with the RTL-SDR plugged in. It should start running & show minimal samples dropped.

(source: https://www.rtl-sdr.com/V4/)

## Install ngrok
`cd /usr/local/bin`  
`sudo wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-arm64.tgz`  
`sudo tar xvzf ./ngrok-v3-stable-linux-arm64.tgz -C .`  
`ngrok authtoken 2nNMZKDeuUYuAlFNRGSlrCidFyB_7o94W8jSupfj9LgHMQdKg`  

## Run on boot
### Setup Information
#### Ensure the RTL-SDRv4 drivers have been installed (top of this doc)
#### Place the rasp-pi folder from repo into /opt/ on the SoC
`sudo mv /path/to/rasp-pi /opt/`  
`sudo chown -R root:root /opt/rasp-pi`  
`sudo chmod -R 755 /opt/rasp-pi`  

#### Place the boot script where it needs to live
`sudo mv /opt/rasp-pi/boot-script.sh /usr/local/bin/`

#### Give the boot script executability
`sudo chmod +x /usr/local/bin/boot-script.sh`

#### Give the boot script permissions to do everything
`sudo chown root:root /usr/local/bin/boot-script.sh`  
`sudo chmod 700 /usr/local/bin/boot-script.sh`  

#### Move systemd unit files into system folder & enable them
`cd /opt/rasp-pi`  
`sudo mv analytics-program.service streaming-program.service boot-program.service /etc/systemd/system`  
`sudo systemctl daemon-reload`  
`sudo systemctl enable analytics-program.service`  
`sudo systemctl enable streaming-program.service`  
`sudo systemctl enable boot-program.service`  

#### Ensure rasp-pi/radio-streaming/README.md instructions have been followed to build `main` executable
`cd /opt/rasp-pi/radio-streaming`  
`sudo apt install golang`  
`sudo go mod tidy`  
`sudo go build ./cmd/main.go`  

## USB configuration
### Format the USB as FAT32 for guaranteed compatibility
### Place two items in root directory on USB prior to booting SoC:
#### SESChannelList.csv
```
Channel Name,Receive Frequency,Transmit Frequency,Band Width
CB66,477.0625,477.0625,12.5K
CB67,477.0875,477.0875,12.5K
CB68,477.1125,477.1125,12.5K
CB69,477.1375,477.1375,12.5K
CB70,477.1625,477.1625,12.5K
```
#### config.txt
```
network_name=yourNetwork
network_password=yourNetworkPassword
server_address=https://cits3200-d5bhb7d7gaeqg2b0.australiacentral-01.azurewebsites.net/sdr
api_key=yourAPIkey
targeting_VHF=False
k=1.5
```
##### api_key
* generated in the front end, one per Entra ID authenticated user.
##### targeting_VHF
* `True`: analytics for Very High Frequency channels
* `False`: analytics for Ultra High Frequency channels
##### k
* `2.0`: for ~threshold of no false utilization positives
* `0.0`(min): for lots of false utilization positives
* `5.0`+: for no false utilization positives
##### comments
* `#`: anything after a # on a line will be a comment & ignored
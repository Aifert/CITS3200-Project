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

## Stock RTL Programs
compgen -c | grep rtl
- rtl_power
- rtl_adsb
- rtl_sdr
- rtl_tcp
- rtl_eeprom
- rtl_fm
- rtl_test
- rtl_biast

### rtl_fm
Captures raw I/Q data from the RTL-SDR dongle.

### rtl_power
Used for spectrum analysis. Scans a range of frequencies and outputs power measurements. Identifying strong signal sources in a given frequency range. Monitoring signal strength over time. Finding clear frequencies for wireless communications. Detecting intermittent or periodic signals

### rtl_tcp
Creates a network server for RTL-SDR. Allows other devices on the network to access the RTL-SDR dongle. RTL_TCP itself doesn't transmit audio. The I/Q data it streams needs to be demodulated by the client software to produce audio. Streaming raw I/Q data requires more bandwidth than streaming demodulated audio.

## Argument For Using Two RTL-SDRv4's
Typically, with a single RTL-SDR device, including the v4 model, it is challenging to simultaneously receive a full audio stream from a single channel while also performing broadband spectrum analysis across the VHF and UHF ranges. This limitation is primarily due to the hardware constraints of these devices:
* Bandwidth limitations: 
  * RTL-SDR devices usually have a maximum instantaneous bandwidth of about 2-3 MHz. This is sufficient for receiving a single channel or performing spectrum analysis over a narrow range, but not enough to cover the entire VHF and UHF spectrum simultaneously.
* Processing power: 
  * The device needs to dedicate its resources to either demodulating a single channel for audio output or rapidly scanning across frequencies for spectrum analysis.
* Tuner limitations: 
  * The RTL-SDR can only be tuned to one center frequency at a time.

Given these constraints, using two separate SDR devices is often the solution for achieving both tasks simultaneously - one for listening to a specific channel and another for broad spectrum analysis. However, some software solutions attempt to work around these limitations:
* Time-sharing: 
  * Some software might rapidly switch between listening to a channel and scanning the spectrum, giving the impression of simultaneous operation. This can work for non-critical applications but may result in gaps in both the audio and the spectrum data.
* Clever use of bandwidth: 
  * If the channel you're listening to is within the 2-3 MHz bandwidth of the RTL-SDR, some software might be able to capture that entire chunk of spectrum, extract the audio from your channel of interest, and also perform limited spectrum analysis within that same bandwidth.
* Advanced signal processing: 
  * Some software packages might use sophisticated algorithms to extrapolate or predict spectrum information outside the current listening bandwidth, though this would not be as accurate as direct measurement.

It's worth noting that more advanced (and typically more expensive) SDR hardware often can perform these tasks simultaneously due to wider instantaneous bandwidth and more processing power. If you need the most accurate and truly simultaneous operation for both listening and broad spectrum analysis, using two separate RTL-SDR devices is the most straightforward and reliable approach.

## (Work In Progress) Process For Gathering Analytics Data
1. scan the SESChannelList.csv file to find the min & max frequencies (transmit & receive are the same for each channel, so either can be used)
   - also gather the min_distance_between_frequencies, as this will be used to calculate the bin size
2. extend the range slightly to accommodate for frequency drift, so min_frequency - 50,000Hz (0.05Mhz) and max_frequency + 50,000Hz (0.05Mhz)
   - verify that these buffers / assigned frequencies don't fall outside of the RTL-SDRv4's range, which is 24 - 1766MHz
     - (source: https://www.rtl-sdr.com/about-rtl-sdr/)
3. run rtl_power over this range to generate the data points across the spectrum
   - rtl_power -f 161.0125M:469.5625M:6250 -d 0 -g 25 -i 10 -e 1m test_output.csv
     - -f 161.0125M:469.5625M:6250		← frequency range & bin size
       - choosing 6,250Hz for bin size as the smallest range between channel frequencies is 12,500Hz (choose algorithmically with min_distance_between_frequencies * 0.5)
     - -d 0						← device index
       - choosing RTL-SDRv4 device 0, as device 1 is used for audio streaming (solution expects two per SoC)
     - -g 25						← gain amount (dB)
       - adding 25dB gain, which is the mid-point between 0 and 50dB (max)
       - main thing here is to choose a gain value, so that samples aren't using auto-gain (since this would cause fluctuations in sample baselines)
     - -i
     - -e
     - name.csv
4. parse the output file to generate results, and send these to the server
   - calculate threshold_above_noise_floor values to use to test for channel activity
     - divide the monitored spectrum into ~even bands, which are <=10MHz ranges from the lowest frequency observed up the spectrum
       - For example, if your total range is 308.55 MHz and you target 10 MHz bands:
         - N = ceil(308.55 / 10) = 31
         - band_width = ceil(308.55 / 31) ≈ 9.95 MHz
         - actual_num_bands = ceil(308.55 / 9.95) = 31
     - slide a window across the channels in the band, as you slide it calculate an average signal strength & standard deviation, test & record the minimum observed value to be the threshold, with threshold_above_noise_floor = minimum_average_signal_strength + (associated_standard_deviation * K) ← K is a constant factor, we will use 2
       - each csv data file represents 1 minutes of samples, so the window could be 10 seconds long, meaning we do 6 calculations per band & take the minimum that we observe.

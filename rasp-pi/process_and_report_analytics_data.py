import csv #reading .csv files
import os #providing directory that this script is in for opening files
import math #infinite numbers, ceiling function
from typing import List, Dict #for providing type hints for lists & dictionaries
from datetime import datetime #for conversion of timestamps to UNIX representation
import time #for conversion of timestamps to UNIX representation
import statistics #for calculating average & standard deviation
import uuid #for receiving MAC address of SoC to hash & send a portion of the digest as our soc-id
import hashlib #for hashing the MAC address of SoC, a portion of which will be sent as our soc-id
import socket #for getting the IP address of the SoC, which will be sent to the server
import json #for dumping a python dictionary into a json string with .dumps()
import requests #for POSTing data to the server
import threading #for running rtl_power in parallel
import subprocess #for spawning rtl power
import shutil #for copying csv files

#component of SESChannel, represents a timestamp of a channel beginning use (start time) or ending use (stop time)
class UtilizationState:
    # CONSTRUCTOR
    def __init__(self, timestamp_unix: int, is_start_time: bool):
        self.timestamp_unix: int = timestamp_unix #stored as a UNIX timestamp (int)
        self.is_start_time: bool = is_start_time #False = is_stop_time
    # REPORTING STATE AS STRING (debugging)
    def __repr__(self) -> str:
        return f"UtilizationState(timestamp_unix={self.timestamp_unix}, is_start_time={self.is_start_time})"

#component of SESChannel, represents a decibel value at a timestamp
class SignalStrengthSample:
    # CONSTRUCTOR
    def __init__(self, timestamp_unix: int, decibel_sample: float):
        self.timestamp_unix: int = timestamp_unix #stored as a UNIX timestamp (int)
        self.decibel_sample: float = decibel_sample
    # REPORTING STATE AS STRING (debugging)
    def __repr__(self) -> str:
        return f"SignalStrengthSample(timestamp_unix={self.timestamp_unix}, decibel_sample={self.decibel_sample})"

#a SES Channel, with its base info from SESChannelList.csv, and processed data to send to the server
class SESChannel:
    # CONSTRUCTOR
    def __init__(self, name: str, frequency_hz: int):
        self.name: str = name
        self.name_clash: bool = False #set to True if this frequency has more than one name assigned to it in SESChannelList.csv
        self.frequency_hz: int = frequency_hz #in Hz (int)
        self.index_to_spectrum_decibel_datapoints: int #channel tuning to relevant rtl_power_output_temporal_samples' spectrum_decibel_datapoints index
        # ...set to -1 if falls outside of our collected data range
        self.signal_is_currently_above_threshold: bool = None #for measuring flips in usage vs non-usage (TODO, consider the possibility of two utilization_states being a start_time or stop_time in a row (if program restarts for instance) for db processing!)
        self.utilization_states: List[UtilizationState] = []
        self.signal_strength_samples: List[SignalStrengthSample] = []
    # REPORTING STATE AS STRING (debugging)
    def __repr__(self) -> str:
        return (f"SESChannel(name='{self.name}', name_clash={self.name_clash}, "
                f"frequency_hz={self.frequency_hz}, "
                f"index_to_spectrum_decibel_datapoints={self.index_to_spectrum_decibel_datapoints}, "
                f"signal_is_currently_above_threshold={self.signal_is_currently_above_threshold}, "
                f"utilization_states={self.utilization_states}, "
                f"signal_strength_samples={self.signal_strength_samples})") #these str concatenate

#a temporal sample from rtl_power, to the resolution of 1 second, with the spectrum's decibel datapoints at that time
class RTLPowerOutputTemporalSample:
    # CONSTRUCTOR
    def __init__(self, timestamp_unix: int, calculated_bin_size: float, starting_frequency: int, spectrum_decibel_datapoints: List[float]):
        self.timestamp_unix: int = timestamp_unix #stored as a UNIX timestamp (int)
        self.calculated_bin_size: float = calculated_bin_size #DO NOT USE THE rtl_power OUTPUT FOR THIS! It's legit wrong, calculate it from the range
        # ...(row's_upper_value - row's_lower_value) / (row's_num_decibel_datapoints) = calculated_bin_size eg. (163125250 - 161012500) / (519 - 6) = 4118.421 (rtl_power reports 4126.46)
        self.starting_frequency: int = starting_frequency #this temporal sample's spectrum's lowest sample frequency (min of the frequency range)
        self.spectrum_decibel_datapoints: List[float] = spectrum_decibel_datapoints #the decibel values up the spectrum for this temporal sample, up the spectrum from starting_frequency separated by calculated_bin_size
    # REPORTING STATE AS STRING (debugging)
    def __repr__(self) -> str:
        return (f"RTLPowerOutputTemporalSample(timestamp_unix={self.timestamp_unix}, "
                f"calculated_bin_size={self.calculated_bin_size}, starting_frequency={self.starting_frequency}, "
                f"spectrum_decibel_datapoints={self.spectrum_decibel_datapoints})") #these str concatenate

#a window slide, aiming for SLIDING_WINDOWS_TARGET_NUM_SAMPLES_PER_AVERAGE of samples, to use in calculating (average + standard_deviation) 
#...signal strengths per frequency range to ultimately select a lowest from each collection of window_slides per window, 
#...which becomes that frequency range's sliding_window_threshold_above_noise_floor_db
class WindowSlide:
    # CONSTRUCTOR
    def __init__(self, samples: List[RTLPowerOutputTemporalSample]):
        self.samples: List[RTLPowerOutputTemporalSample] = samples #samples in this WindowSlide, ideally SLIDING_WINDOWS_TARGET_NUM_SAMPLES_PER_AVERAGE of them

    # REPORTING STATE AS STRING (debugging)
    def __repr__(self) -> str:
        return (f"samples={self.samples}")

# CONSTANTS
RTL_SDR_V4_RANGE_MIN_HZ: int = 24000000 #24MHz (represented in Hz)
RTL_SDR_V4_RANGE_MAX_HZ: int = 1766000000 #1.766GHz (1766MHz) (represented in Hz)
VHF_RANGE_MIN_HZ: int = 30000000 #30MHz (represented in Hz)
VHF_RANGE_MAX_HZ: int = 300000000 #300MHz (represented in Hz)
UHF_RANGE_MIN_HZ: int = 300000000 #300MHz (represented in Hz)
UHF_RANGE_MAX_HZ: int = 3000000000 #3GHz (3000MHz) (represented in Hz)
TEST_RANGE_MIN_HZ: int = 477087500 #CB channel 67
TEST_RANGE_MAX_HZ: int = 477087500 #CB channel 67
RANGE_DRIFT_OFFSET_HZ: int = 50000 #0.05MHz (represented in Hz), subtract from min_rtl_power_frequency_hz, add to max_rtl_power_frequency_hz
SLIDING_WINDOWS_TARGET_NUM_SAMPLES_PER_AVERAGE: int = 10 #each sliding window is aiming to calculate averages for signal strength from 10 time samples from rtl_power_temporal_samples
SLIDING_WINDOWS_BAND_SIZE_MAX_HZ: int = 2000000 #2MHz (represented in Hz), maximum size of sliding window bands
SES_CHANNEL_LIST_FILE_NAME = 'SESChannelList.csv'
SES_CHANNEL_FOLDER_NAME = 'SESChannelList'
RTL_POWER_OUTPUT_FILE_NAME = 'rtl_power_output.csv'
RTL_POWER_IN_PROGRESS_FILE_NAME = 'rtl_power_in_progress.csv'
RTL_POWER_OUTPUT_FOLDER_NAME = 'rtl_powerOutput'
NUM_RTL_POWER_CONTEXT_COLUMNS = 6
K: float = 2.0 #multiplier for associated_standard_deviation calculation when setting sliding_windows_thresholds_above_noise_floor_db
# ...raise this value to raise your squelch floor for activity!
DEFAULT_PORT: int = 8080 #port number to send to server as where we'll expect communication
DATA_ENDPOINT_FOR_SERVER: str = '/upload/data' #where we should POST the data we gather
SERVER_ADDRESS: str = 'https://20.191.210.182:9000' #server's URL
MAX_TIME_TO_SEND_DATA_TO_SERVER_SECONDS: int = 30 #timeout parameter to requests.post
RTL_POWER_GAIN_DB: int = 0 #gain to add to rtl_power output, needs to be set else uses automatic (throws our baseline off)
RTL_POWER_SDR_DEVICE_INDEX: int = 0 #using RTL-SDRv4 number 0 (of [0, 1]) since 1 is used for audio streaming
RTL_POWER_INTEGRATION_INTERVAL_SECONDS: int = 1 #number of seconds between each sample, rtl_power supports a minimum of 1sec
RTL_POWER_EXIT_TIMER_SECONDS: int = 60 #number of seconds rtl_power will sample data for before outputting a data file, which we then parse & attempt to send to the server

# GLOBAL VARIABLES
targeting_VHF: bool = True #aiming to analyze Very High Frequency range, False means Ultra High Frequency range
targeting_test_range: bool = False #set to True to target the test range in CONSTANTS
min_targeted_frequency_hz: int #minimum SESChannelList.csv frequency we are analyzing
max_targeted_frequency_hz: int #maximum SESChannelList.csv frequency we are analyzing
min_rtl_power_frequency_hz: int #minimum frequency in range we're analyzing, -RANGE_DRIFT_OFFSET_HZ Hz (accommodate frequency drift)
max_rtl_power_frequency_hz: int #maximum frequency in range we're analyzing, +RANGE_DRIFT_OFFSET_HZ Hz (accommodate frequency drift)
min_distance_between_frequencies_hz: int #minimum distance between frequencies in the range we're analyzing
SES_channels: List[SESChannel] = [] #list of SES_channels, sorted by frequency, with no duplicate frequencies (if there is a name clash only one channel is recorded)
SES_channels_index_lookup_dictionary: Dict[int, int] = {} #query a frequency and get an index to it in SES_channels, or None if it doesn't exist (use .get)
RTL_SDR_V4_tuning_hz: int = 0 #if RTL-SDR is out of tune, its measurements will be adjusted by this value to align with SES_channels frequencies
rtl_power_output_temporal_samples: List[RTLPowerOutputTemporalSample] = [] #samples moving forward in time, with the spectrum's decibel values per time slice (TODO, adjust docs as this is no longer a 2D array)
num_sliding_window_frequency_ranges: int #number of sliding window frequency ranges (<= SLIDING_WINDOWS_BAND_SIZE_MAX_HZ each) to cover our analysis range
# ...num_sliding_window_frequency_ranges = math.ceil(range_hz / SLIDING_WINDOWS_BAND_SIZE_MAX_HZ)
sliding_windows_band_width_hz: int #the actual band width of our sliding windows (<= SLIDING_WINDOWS_BAND_SIZE_MAX_HZ)
# ...math.ceil(range_hz / num_sliding_window_frequency_ranges)
sliding_windows_thresholds_above_noise_floor_db: List[float] = [] #threshold above which we consider channels in this window 'in use'
# ...index into your appropriate sliding window threshold here with: 
# ...int((channel_frequency_hz - min_rtl_power_frequency_hz) / sliding_windows_band_width_hz)
message_id: int = 0 # tally for how many messages sent to the server while running, to send with each update, so DB knows if data has been lost since last period
data_queue = [] #queue for data strings that need to be sent to the web server

# FUNCTIONS

# Converts MHz representation (float) to Hz representation (int)
def convert_mhz_to_hz_int(mhz):
    hz = float(mhz) * 1000000
    hz = int(hz)
    return hz

# Set the desired range of our analytics (wider range = greater strain on RTL-SDRv4)
def set_targeted_frequency_range(targeting_VHF: bool, targeting_test_range: bool):
    global min_targeted_frequency_hz
    global max_targeted_frequency_hz
    if(targeting_VHF):
        # VHF
        min_targeted_frequency_hz = VHF_RANGE_MIN_HZ
        max_targeted_frequency_hz = VHF_RANGE_MAX_HZ
    else:
        # UHF
        min_targeted_frequency_hz = UHF_RANGE_MIN_HZ
        max_targeted_frequency_hz = UHF_RANGE_MAX_HZ
    if(targeting_test_range):
        # TEST RANGE (will take priority if enabled)
        min_targeted_frequency_hz = TEST_RANGE_MIN_HZ
        max_targeted_frequency_hz = TEST_RANGE_MAX_HZ
    #print(min_targeted_frequency_hz) #DEBUG
    #print(max_targeted_frequency_hz) #DEBUG

# READ SESChannelList.csv AND POPULATE SES_channels WITH CHANNELS WITHIN OUR RANGE (VHF, UHF, test) (SEE CONSTANTS FOR RANGES)
# ...test for read failure
def read_and_populate_SES_channels_list() -> bool: #return bool to indicate success / failure
    # READ SESChannelList.csv
    try:
        current_directory = os.path.dirname(os.path.abspath(__file__))
        full_path_to_channel_list = os.path.join(current_directory + '/' + SES_CHANNEL_FOLDER_NAME, SES_CHANNEL_LIST_FILE_NAME)
        with open(full_path_to_channel_list, 'r') as file:
            csv_reader = csv.reader(file)
            next(csv_reader) #skip the first row
            for row in csv_reader:
                try:
                    #print(row) #DEBUG
                    new_channel = SESChannel(name=row[0], frequency_hz=convert_mhz_to_hz_int(row[1]))
                    #print(convert_mhz_to_hz_int(row[1])) #DEBUG
                    # TEST THAT CHANNEL IS WITHIN OUR TARGETED RANGE
                    if(min_targeted_frequency_hz <= new_channel.frequency_hz & new_channel.frequency_hz <= max_targeted_frequency_hz):
                        # ADD CHANNEL TO OUR LIST
                        SES_channels.append(new_channel)
                except IndexError:
                    print(f"Warning: Skipping malformed row in {SES_CHANNEL_LIST_FILE_NAME} CSV: {row}")
                except ValueError:
                    print(f"Warning: Invalid frequency value in {SES_CHANNEL_LIST_FILE_NAME} row: {row}")
        if not SES_channels:
            print(f"Warning: No channels were found in {SES_CHANNEL_LIST_FILE_NAME} within the targeted frequency range.")
        return True  #indicate successful read and population 
    except FileNotFoundError:
        print(f"Error: The file {SES_CHANNEL_LIST_FILE_NAME} was not found in {SES_CHANNEL_FOLDER_NAME}.")
    except PermissionError:
        print(f"Error: Permission denied when trying to read {SES_CHANNEL_LIST_FILE_NAME}.")
    except csv.Error as e:
        print(f"Error: CSV file {SES_CHANNEL_LIST_FILE_NAME} could not be parsed: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

# PARSE SES_channels AND REMOVE ANY DUPLICATE FREQUENCIES (MARKING THE KEPT CHANNEL AS A name_clash)
# ...assumes the SES_channels list is already sorted by frequency
def remove_SES_duplicate_frequencies():
    clashed_channels_to_remove = []
    previous_SES_channel = None
    for channel in SES_channels:
        if(previous_SES_channel == None):
            previous_SES_channel = channel
            continue
        if(previous_SES_channel.frequency_hz == channel.frequency_hz):
            clashed_channels_to_remove.append(previous_SES_channel)
            channel.name_clash = True
        previous_SES_channel = channel
    for channel in clashed_channels_to_remove:
        SES_channels.remove(channel)

# PARSE SES_channels AND RECORD THE min_distance_between_frequencies_hz
def record_min_distance_between_frequencies():
    global min_distance_between_frequencies_hz
    min_distance_between_frequencies_hz = math.inf #max value
    previous_SES_channel = None
    for channel in SES_channels:
        if(previous_SES_channel == None):
            previous_SES_channel = channel
            continue
        distance_between_frequencies = abs(previous_SES_channel.frequency_hz - channel.frequency_hz)
        if(distance_between_frequencies < min_distance_between_frequencies_hz):
            min_distance_between_frequencies_hz = distance_between_frequencies
            #print(min_distance_between_frequencies_hz) #DEBUG

# PARSE SES_channels AND CREATE SES_channels_index_lookup_dictionary ENTRIES FOR FREQUENCIES -> INDEXES (INTO SES_channels)
def create_SES_channels_index_lookup_dictionary():
    for index, channel in enumerate(SES_channels):
        SES_channels_index_lookup_dictionary[channel.frequency_hz] = index #(TODO, consider if this is even necessary, and if we should index into channel.frequency_hz + RTL_SDR_V4_tuning_hz)
    #print(SES_channels_index_lookup_dictionary[162150000]) #DEBUG

# SET THE min_rtl_power_frequency_hz AND max_rtl_power_frequency_hz BASED ON SES_channels, RANGE_DRIFT_OFFSET_HZ, AND RTL_SDR_V4_RANGE_MIN & MAX
# ...ensure there is at least 1Hz difference between min & max, else rtl_power will generate a file 0.5Gb large with a sample rate of 0Hz! Insert this 1Hz if it's needed.
def set_rtl_power_frequency_range():
    global min_rtl_power_frequency_hz
    global max_rtl_power_frequency_hz
    if(not SES_channels): 
        return False #test for empty channels list edge case
    min_rtl_power_frequency_hz = SES_channels[0].frequency_hz
    max_rtl_power_frequency_hz = SES_channels[-1].frequency_hz
    min_rtl_power_frequency_hz -= RANGE_DRIFT_OFFSET_HZ
    max_rtl_power_frequency_hz += RANGE_DRIFT_OFFSET_HZ
    if(min_rtl_power_frequency_hz < RTL_SDR_V4_RANGE_MIN_HZ):
        print(f"Warning: Some SES Channels fall below the RTL-SDRv4's minimum range of {RTL_SDR_V4_RANGE_MIN_HZ}Hz.")
        min_rtl_power_frequency_hz = RTL_SDR_V4_RANGE_MIN_HZ
    if(max_rtl_power_frequency_hz > RTL_SDR_V4_RANGE_MAX_HZ):
        print(f"Warning: Some SES Channels fall above the RTL-SDRv4's maximum range of {RTL_SDR_V4_RANGE_MAX_HZ}Hz.")
        max_rtl_power_frequency_hz = RTL_SDR_V4_RANGE_MAX_HZ
    if(min_rtl_power_frequency_hz == max_rtl_power_frequency_hz):
        max_rtl_power_frequency_hz += 1

# CONVERT date AND time STRINGS INTO UNIX int
# ...example input: '2024-09-18', '19:16:02'
def convert_date_and_time_to_unix(csv_date: str, csv_time: str) -> int:
    datetime_string = f"{csv_date} {csv_time}"
    datetime_object = datetime.strptime(datetime_string, '%Y-%m-%d %H:%M:%S')
    unix_timestamp = int(time.mktime(datetime_object.timetuple()))
    #print(f"Unix timestamp: {unix_timestamp}") #DEBUG
    return unix_timestamp

# READ rtl_power_output.csv AND POPULATE rtl_power_output_temporal_samples WITH ALL AVAILABLE TEMPORAL SAMPLES
# ...test for read failure
def read_and_populate_rtl_power_output_temporal_samples():
    # READ rtl_power_output.csv
    try:
        current_directory = os.path.dirname(os.path.abspath(__file__))
        full_path_to_rtl_power_output = os.path.join(current_directory + '/' + RTL_POWER_OUTPUT_FOLDER_NAME, RTL_POWER_OUTPUT_FILE_NAME)
        with open(full_path_to_rtl_power_output, 'r') as file:
            csv_reader = csv.reader(file)
            current_rtl_power_temporal_sample: RTLPowerOutputTemporalSample = None
            for row in csv_reader:
                try:
                    #print(row) #DEBUG
                    #print(len(row)) #DEBUG
                    row_unix_timestamp = convert_date_and_time_to_unix(row[0], row[1])
                    num_data_columns_in_row = len(row) - NUM_RTL_POWER_CONTEXT_COLUMNS
                    row_starting_frequency_hz = int(row[2])
                    row_upper_frequency_hz = int(row[3])
                    row_bin_size: float = (row_upper_frequency_hz - row_starting_frequency_hz) / num_data_columns_in_row #DO NOT USE THE rtl_power OUTPUT FOR THIS! It's legit wrong, calculate it from the range
                    # ...(row's_upper_value - row's_lower_value) / (row's_num_decibel_datapoints) = calculated_bin_size eg. (163125250 - 161012500) / (519 - 6) = 4118.421 (rtl_power reports 4126.46)
                    row_spectrum_decibel_datapoints: List[float] = []
                    for i in range(NUM_RTL_POWER_CONTEXT_COLUMNS, len(row)):
                        row_spectrum_decibel_datapoints.append(float(row[i]))
                        #print(float(row[i])) #DEBUG
                    #print(row[1]) #DEBUG
                    #print(row_bin_size) #DEBUG
                    # TEST WHICH TIME SLICE THIS BELONGS TO
                    if(current_rtl_power_temporal_sample == None):
                        # FIRST ENTRY
                        # ...create & begin populating current_rtl_power_temporal_sample
                        current_rtl_power_temporal_sample = RTLPowerOutputTemporalSample(row_unix_timestamp, row_bin_size, 
                                                                                         row_starting_frequency_hz, row_spectrum_decibel_datapoints)
                    elif(current_rtl_power_temporal_sample.timestamp_unix == row_unix_timestamp):
                        # ANOTHER ROW FOR THE SAME TIME SLICE
                        # ...carry on populating decibel datapoints
                        current_rtl_power_temporal_sample.spectrum_decibel_datapoints.extend(row_spectrum_decibel_datapoints)
                    elif(current_rtl_power_temporal_sample.timestamp_unix != row_unix_timestamp):
                        # ROW ASSOCIATED WITH A NEW TIME SLICE
                        # ...file the old one in rtl_power_output_temporal_samples
                        # ...create & begin populating a new current_rtl_power_temporal_sample
                        rtl_power_output_temporal_samples.append(current_rtl_power_temporal_sample)
                        current_rtl_power_temporal_sample = RTLPowerOutputTemporalSample(row_unix_timestamp, row_bin_size, 
                                                                                         row_starting_frequency_hz, row_spectrum_decibel_datapoints)
                except IndexError:
                    print(f"Warning: Skipping malformed row in {RTL_POWER_OUTPUT_FILE_NAME} CSV: {row}")
            if(current_rtl_power_temporal_sample != None):
                    # FINAL TIME SLICE (if there were any to begin with)
                    # ...file it in rtl_power_output_temporal_samples
                    rtl_power_output_temporal_samples.append(current_rtl_power_temporal_sample)
        if not rtl_power_output_temporal_samples:
            print(f"Warning: No data was recorded from the file {RTL_POWER_OUTPUT_FILE_NAME} generated by rtl_power.")
        return True  #indicate successful read and population 
    except FileNotFoundError:
        print(f"Error: The file {RTL_POWER_OUTPUT_FILE_NAME} was not found in {RTL_POWER_OUTPUT_FOLDER_NAME}.")
    except PermissionError:
        print(f"Error: Permission denied when trying to read {RTL_POWER_OUTPUT_FILE_NAME}.")
    except csv.Error as e:
        print(f"Error: CSV file {RTL_POWER_OUTPUT_FILE_NAME} could not be parsed: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

# CALCULATE num_sliding_window_frequency_ranges AND sliding_windows_band_width_hz
def set_num_and_width_of_sliding_windows():
    global num_sliding_window_frequency_ranges #number of sliding window frequency ranges (<= SLIDING_WINDOWS_BAND_SIZE_MAX_HZ each) to cover our analysis range
    # ...num_sliding_window_frequency_ranges = math.ceil(range_hz / SLIDING_WINDOWS_BAND_SIZE_MAX_HZ)
    global sliding_windows_band_width_hz #the actual band width of our sliding windows (<= SLIDING_WINDOWS_BAND_SIZE_MAX_HZ)
    # ...math.ceil(range_hz / num_sliding_window_frequency_ranges)
    if(rtl_power_output_temporal_samples):
        rtl_power_output_min_frequency_hz = rtl_power_output_temporal_samples[0].starting_frequency
        rtl_power_output_max_frequency_hz = rtl_power_output_min_frequency_hz + math.ceil(len(rtl_power_output_temporal_samples[0].spectrum_decibel_datapoints) * rtl_power_output_temporal_samples[0].calculated_bin_size) #(we don't use (num_datapoints - 1) because we want the upper end of the last bin)
        rtl_power_output_frequency_width_hz = rtl_power_output_max_frequency_hz - rtl_power_output_min_frequency_hz
        num_sliding_window_frequency_ranges = math.ceil(rtl_power_output_frequency_width_hz / SLIDING_WINDOWS_BAND_SIZE_MAX_HZ)
        sliding_windows_band_width_hz = math.ceil(rtl_power_output_frequency_width_hz / num_sliding_window_frequency_ranges)
    else:
        print(f"Warning: No sliding windows assigned as no data was recorded from the file {RTL_POWER_OUTPUT_FILE_NAME} generated by rtl_power.")

# CALCULATE sliding_windows_thresholds_above_noise_floor_db THRESHOLDS FOR CHANNEL ACTIVITY
# ...slide the windows along, for each movement collate a number of samples of SLIDING_WINDOWS_TARGET_NUM_SAMPLES_PER_AVERAGE and calculate a
# ...(minimum_average_signal_strength + (associated_standard_deviation * K)) <-- K is a constant factor
# ...once done sliding, the smallest of these values per window should become its sliding_windows_thresholds_above_noise_floor_db entry
def set_sliding_windows_thesholds_above_noise_floor_db():
    if(rtl_power_output_temporal_samples):
        window_slides: List[WindowSlide] = []
        window_slide_samples: List[RTLPowerOutputTemporalSample]  = []
        # POPULATE window_slides WITH WINDOW SLIDES OF LENGTH SLIDING_WINDOWS_TARGET_NUM_SAMPLES_PER_AVERAGE 
        # ...(only permit shorter if there is not enough data for even a single window length)
        for temporal_sample in rtl_power_output_temporal_samples:
            window_slide_samples.append(temporal_sample)
            if(len(window_slide_samples) == SLIDING_WINDOWS_TARGET_NUM_SAMPLES_PER_AVERAGE):
                window_slide = WindowSlide(window_slide_samples)
                window_slides.append(window_slide)
                window_slide_samples = []
        if(window_slide_samples and not window_slides):
            window_slide = WindowSlide(window_slide_samples)
            window_slides.append(window_slide)
        # ITERATE BY WINDOW FREQUENCY RANGE TO CALCULATE sliding_windows_thresholds_above_noise_floor_db PER RANGE
        for i in range(0, num_sliding_window_frequency_ranges):
            lowest_threshold_above_noise_floor_in_range: float = math.inf
            for window_slide in window_slides:
                samples_in_sliding_window_frequency_range_db: List[float] = []
                for temporal_sample in window_slide.samples:
                    for index, spectrum_decibel_datapoint in enumerate(temporal_sample.spectrum_decibel_datapoints):
                        frequency_of_spectrum_decibel_datapoint = temporal_sample.starting_frequency + (index * temporal_sample.calculated_bin_size)
                        rtl_power_output_min_frequency_hz = temporal_sample.starting_frequency
                        #rtl_power_output_max_frequency_hz = rtl_power_output_min_frequency_hz + math.ceil(len(temporal_sample.spectrum_decibel_datapoints) * temporal_sample.calculated_bin_size) #(we don't use (num_datapoints - 1) because we want the upper end of the last bin)
                        if(rtl_power_output_min_frequency_hz + (sliding_windows_band_width_hz * i) <= frequency_of_spectrum_decibel_datapoint
                           and frequency_of_spectrum_decibel_datapoint <= rtl_power_output_min_frequency_hz + (sliding_windows_band_width_hz * (i + 1))):
                            samples_in_sliding_window_frequency_range_db.append(spectrum_decibel_datapoint)
                # CALCULATE POTENTIAL lowest_threshold_above_noise_floor_in_range
                average_signal_strength = statistics.mean(samples_in_sliding_window_frequency_range_db)
                associated_standard_deviation = statistics.stdev(samples_in_sliding_window_frequency_range_db)
                potential_threshold_above_noise_floor_in_range = average_signal_strength + (associated_standard_deviation * K)
                lowest_threshold_above_noise_floor_in_range = min(lowest_threshold_above_noise_floor_in_range, potential_threshold_above_noise_floor_in_range)
            # ASSIGN LOWEST FOUND lowest_threshold_above_noise_floor_in_range FOR THIS WINDOW FREQUENCY RANGE TO sliding_windows_thresholds_above_noise_floor_db
            sliding_windows_thresholds_above_noise_floor_db.append(lowest_threshold_above_noise_floor_in_range)
    else:
        print(f"Warning: No thresholds for activity calculated as no data was recorded from the file {RTL_POWER_OUTPUT_FILE_NAME} generated by rtl_power.")

# TUNE SES_channels TO NEAREST rtl_power_output_temporal_samples' spectrum_decibel_datapoints INDEX
# ...ACCOUNT FOR RTL_SDR_V4_tuning_hz OFFSET
# ...set each SES_channels' index_to_spectrum_decibel_datapoints with this index
def tune_SES_channels_to_rtl_power_output():
    if(rtl_power_output_temporal_samples):
        for channel in SES_channels:
            channel_frequency_hz = channel.frequency_hz + RTL_SDR_V4_tuning_hz #OFFSET TO ALIGN WITH RTL-SDR TUNING (TODO, implement tuning, the offset is always 0 atm)
            rtl_power_output_min_frequency_hz = rtl_power_output_temporal_samples[0].starting_frequency
            rtl_power_output_max_frequency_hz = rtl_power_output_min_frequency_hz + math.ceil(len(rtl_power_output_temporal_samples[0].spectrum_decibel_datapoints) * rtl_power_output_temporal_samples[0].calculated_bin_size) #(we don't use (num_datapoints - 1) because we want the upper end of the last bin)
            rtl_power_output_bin_size = rtl_power_output_temporal_samples[0].calculated_bin_size
            if rtl_power_output_min_frequency_hz <= channel_frequency_hz <= rtl_power_output_max_frequency_hz:
                #calculate the index
                index = round((channel_frequency_hz - rtl_power_output_min_frequency_hz) / rtl_power_output_bin_size)
                channel.index_to_spectrum_decibel_datapoints = index #channel tuning to relevant rtl_power_output_temporal_samples' spectrum_decibel_datapoints index
            else:
                #channel frequency is outside the range of collected data
                channel.index_to_spectrum_decibel_datapoints = -1 #channel tuning to relevant rtl_power_output_temporal_samples' spectrum_decibel_datapoints index
                # ...set to -1 if falls outside of our collected data range
    else:
        print(f"Warning: No data to tune SES_channels to as no data was recorded from the file {RTL_POWER_OUTPUT_FILE_NAME} generated by rtl_power.")

# FOR EACH SESChannel IN SES_channels WALK THROUGH rtl_power_output_temporal_samples AT YOUR index_to_spectrum_decibel_datapoints
# ...IF spectrum_decibel_datapoints[index_to_spectrum_decibel_datapoints] > or < relevant sliding_windows_thresholds_above_noise_floor_db
# ...based on your current signal_is_currently_above_threshold, potentially generate a UtilizationState in utilization_states
def generate_utilization_states():
    if(rtl_power_output_temporal_samples):
        for channel in SES_channels:
            if(channel.index_to_spectrum_decibel_datapoints != -1):
                #channel has data to test against
                for temporal_sample in rtl_power_output_temporal_samples:
                    if(channel.signal_is_currently_above_threshold == None):
                        #first data point assessment for this channel, should assign as per the first sample
                        rtl_power_output_min_frequency_hz = rtl_power_output_temporal_samples[0].starting_frequency
                        threshold_index_for_this_channel = int(((channel.frequency_hz + RTL_SDR_V4_tuning_hz) - rtl_power_output_min_frequency_hz) / sliding_windows_band_width_hz)
                        threshold_for_this_channel = sliding_windows_thresholds_above_noise_floor_db[threshold_index_for_this_channel]
                        signal_is_hot = False
                        if(temporal_sample.spectrum_decibel_datapoints[channel.index_to_spectrum_decibel_datapoints] >= threshold_for_this_channel):
                            signal_is_hot = True
                        utilization_state = UtilizationState(temporal_sample.timestamp_unix, signal_is_hot)
                        channel.utilization_states.append(utilization_state)
                        channel.signal_is_currently_above_threshold = signal_is_hot
                    else:
                        #test if we've had a flip in activity over the threshold, and record if so
                        rtl_power_output_min_frequency_hz = rtl_power_output_temporal_samples[0].starting_frequency
                        threshold_index_for_this_channel = int(((channel.frequency_hz + RTL_SDR_V4_tuning_hz) - rtl_power_output_min_frequency_hz) / sliding_windows_band_width_hz)
                        threshold_for_this_channel = sliding_windows_thresholds_above_noise_floor_db[threshold_index_for_this_channel]
                        signal_is_hot = False
                        if(temporal_sample.spectrum_decibel_datapoints[channel.index_to_spectrum_decibel_datapoints] >= threshold_for_this_channel):
                            signal_is_hot = True
                        if(signal_is_hot != channel.signal_is_currently_above_threshold):
                            #activity flipped, record
                            utilization_state = UtilizationState(temporal_sample.timestamp_unix, signal_is_hot)
                            channel.utilization_states.append(utilization_state)
                            channel.signal_is_currently_above_threshold = signal_is_hot
    else:
        print(f"Warning: No utilization states generated as no data was recorded from the file {RTL_POWER_OUTPUT_FILE_NAME} generated by rtl_power.")

# DEBUG method that does as its name suggests
def print_which_channels_have_utilization():
    for channel in SES_channels:
        has_utilization = False
        for utilization_state in channel.utilization_states:
            if(utilization_state.is_start_time):
                has_utilization = True
        if(has_utilization):
            print(f"{channel.name} has utilization!")

# FOR EACH SESChannel IN SES_channels RECORD THE VERY LAST rtl_power_output_temporal_samples AT YOUR index_to_spectrum_decibel_datapoints
# ...AS THE SignalStrengthSample ENTRY IN YOUR signal_strength_samples
def record_signal_strength_samples():
    if(rtl_power_output_temporal_samples):
        for channel in SES_channels:
            if(channel.index_to_spectrum_decibel_datapoints != -1):
                #channel has data to test against
                temporal_sample = rtl_power_output_temporal_samples[-1]
                signal_strength_sample_db: float = temporal_sample.spectrum_decibel_datapoints[channel.index_to_spectrum_decibel_datapoints]
                signal_strength_sample = SignalStrengthSample(temporal_sample.timestamp_unix, signal_strength_sample_db)
                channel.signal_strength_samples.append(signal_strength_sample)
    else:
        print(f"Warning: No signal strength samples recorded as no data was recorded from the file {RTL_POWER_OUTPUT_FILE_NAME} generated by rtl_power.")

# FOR EACH SESChannel IN SES_channels RECORD THE MAX SIGNAL STRENGTH rtl_power_output_temporal_sample AT YOUR index_to_spectrum_decibel_datapoints
# ...AS THE SignalStrengthSample ENTRY IN YOUR signal_strength_samples
def record_max_signal_strength_samples():
    if(rtl_power_output_temporal_samples):
        for channel in SES_channels:
            if(channel.index_to_spectrum_decibel_datapoints != -1):
                #channel has data to test against
                max_signal_strength_sample_db: float = None
                for temporal_sample in rtl_power_output_temporal_samples:
                    signal_strength_sample_db: float = temporal_sample.spectrum_decibel_datapoints[channel.index_to_spectrum_decibel_datapoints]
                    if(max_signal_strength_sample_db == None):
                        max_signal_strength_sample_db = signal_strength_sample_db
                    elif(signal_strength_sample_db > max_signal_strength_sample_db):
                        max_signal_strength_sample_db = signal_strength_sample_db
                end_temporal_sample = rtl_power_output_temporal_samples[-1]
                signal_strength_sample = SignalStrengthSample(end_temporal_sample.timestamp_unix, max_signal_strength_sample_db)
                channel.signal_strength_samples.append(signal_strength_sample)
    else:
        print(f"Warning: No signal strength samples recorded as no data was recorded from the file {RTL_POWER_OUTPUT_FILE_NAME} generated by rtl_power.")

# DEBUG method that does as its name suggests
def print_signal_strength_samples_for_observed_channels():
    for index, channel in enumerate(SES_channels):
        for signal_strength in channel.signal_strength_samples:
            print(f"{index}. {channel.name} at {signal_strength.timestamp_unix} has signal strength {signal_strength.decibel_sample}db.")

# EMPTY rtl_power_output_temporal_samples AND sliding_windows_thresholds_above_noise_floor_db,
# ...AND RESET EACH CHANNEL'S signal_is_currently_above_threshold TO None NOW THAT PROCESSING IS DONE
def reset_state_for_next_rtl_power_read():
    global rtl_power_output_temporal_samples
    global sliding_windows_thresholds_above_noise_floor_db
    rtl_power_output_temporal_samples = []
    sliding_windows_thresholds_above_noise_floor_db = []
    for channel in SES_channels:
        channel.signal_is_currently_above_threshold = None

# GENERATES A soc-id VALUE TO SEND TO THE SERVER, A PORTION OF THE DIGEST OF OUR HASHED MAC ADDRESS
def generate_soc_id() -> int:
    #get the MAC address
    mac = uuid.getnode()
    #print(mac) #DEBUG
    #hash the MAC address
    hashed_mac = hashlib.sha256(str(mac).encode()).hexdigest()
    #print(hashed_mac) #DEBUG
    #take the first 10 characters of the hash
    soc_id = int(hashed_mac[:4], 16)
    #print(soc_id) #DEBUG
    return soc_id

# GENERATES A address VALUE TO SEND TO THE SERVER, OUR IP WITH A CONSTANT PORT AS IP:PORT
def generate_address() -> str:
    ip_address = socket.gethostbyname(socket.gethostname())
    port = DEFAULT_PORT
    address = f"{ip_address}:{port}"
    #print(address) #DEBUG
    return address

# FOR EACH SESChannel IN SES_channels WITH DATA, REPRESENT IN JSON THE CONTENTS OF YOUR utilization_states AND signal_strength_samples
# ...AND INCLUDE message_id AND address AND soc-id METADATA
def prepare_channel_data() -> str:
    soc_id: int = generate_soc_id()
    address = generate_address()
    channels_data = {}
    for channel in SES_channels:
        if(channel.utilization_states and channel.signal_strength_samples):
            #only include channels that have data
            channel_data = {
                "usage": [],
                "strength": {}
            }
            for utilization_state in channel.utilization_states:
                channel_data["usage"].append([utilization_state.timestamp_unix, utilization_state.is_start_time])
            for signal_strength_sample in channel.signal_strength_samples:
                channel_data["strength"][signal_strength_sample.timestamp_unix] = signal_strength_sample.decibel_sample
            channels_data[channel.frequency_hz] = channel_data
    #prepare the final json_data
    json_data = {
        "soc-id": soc_id,
        "address": address,
        "message-id": message_id,
        "data": channels_data
    }
    json_string = json.dumps(json_data)
    #print(json_string) #DEBUG
    return json_string

# POST JSON DATA TO THE SERVER AT DATA_ENDPOINT_FOR_SERVER
def upload_data(json_data_to_upload: str) -> bool:
    global data_queue
    data_queue.append(json_data_to_upload)
    try:
        while len(data_queue) > 0:
            next_data = data_queue[0]
            url = f"{SERVER_ADDRESS}{DATA_ENDPOINT_FOR_SERVER}"
            #headers for the request
            headers = {
                "Content-Type": "application/json"
            }
            #POST the request
            response = requests.post(url, data=next_data, headers=headers, timeout=MAX_TIME_TO_SEND_DATA_TO_SERVER_SECONDS, verify=False)
            #check if the request was successful
            if response.status_code == 200:
                print("Data uploaded successfully!")
                data_queue.pop(0)
            else:
                print(f"Failed to upload data. Status code: {response.status_code}")
                print(f"Response: {response.text}")
                return False
            time.sleep(1)
        return True
    except requests.exceptions.Timeout:
        print("Request timed out. The server did not respond within the allocated time.")
        return False
    except requests.exceptions.RequestException as e:
        print(f"An error occurred while uploading data: {e}")
        return False
    except:
        print("An unknown error occured")

def run_rtl_power():
    # Hi Joseph! LOOP FROM HERE, AND USE min_rtl_power_frequency_hz AND max_rtl_power_frequency_hz AS YOUR rtl_power FREQUENCY RANGE
    # ...AND USE int(min_distance_between_frequencies_hz * 0.5) AS YOUR BIN SIZE FOR rtl_power
    # ...the other rtl_power parameters you can read about in README.md, I think gain should be reduced to 1db from 25db (set these as CONSTANTS)

    # RUN rtl_power (TODO)
    #subprocess.run(["python3", "rtl_power_sim.py"])
    subprocess.run(["rtl_power", f"-f {min_rtl_power_frequency_hz}:{max_rtl_power_frequency_hz}:{int(min_distance_between_frequencies_hz * 0.5)}", f"-d {RTL_POWER_SDR_DEVICE_INDEX}", f"-g {RTL_POWER_GAIN_DB}", f"-i {RTL_POWER_INTEGRATION_INTERVAL_SECONDS}", f"-e {RTL_POWER_EXIT_TIMER_SECONDS}", RTL_POWER_OUTPUT_FOLDER_NAME+"/"+RTL_POWER_IN_PROGRESS_FILE_NAME])

def parse_SES_channels():
    global SES_channels

    # QUERY SERVER TO DETERMINE IF targeting_VHF (TODO, add to docs too)

    # USE A KNOWN STRONG FREQUENCY TO SET RTL_SDR_V4_tuning_hz, IF RTL-SDR IS OUT OF TUNE (TODO, this is worked through the code but optional to implement)

    # READ SESChannelList.csv AND POPULATE SES_channels WITH CHANNELS WITHIN OUR RANGE (VHF, UHF, test) (SEE CONSTANTS FOR RANGES)
    # ...test for read failure
    set_targeted_frequency_range(targeting_VHF, targeting_test_range)
    read_and_populate_SES_channels_list()

    # VERIFY THAT WE HAVE CHANNELS IN OUR RANGE TO MONITOR (in practice we always should, else this code has nothing to analyze)
    if(len(SES_channels) == 0):
        print(f"Warning: No channels in {SES_CHANNEL_LIST_FILE_NAME} within our analysis range, nothing to do")

    # SORT SES_channels BY FREQUENCY
    SES_channels = sorted(SES_channels, key=lambda channel: channel.frequency_hz)

    # PARSE SES_channels AND REMOVE ANY DUPLICATE FREQUENCIES (MARKING THE KEPT CHANNEL AS A name_clash)
    remove_SES_duplicate_frequencies()

    # PARSE SES_channels AND RECORD THE min_distance_between_frequencies_hz
    record_min_distance_between_frequencies()

    # PARSE SES_channels AND CREATE SES_channels_index_lookup_dictionary ENTRIES FOR FREQUENCIES -> INDEXES (INTO SES_channels)
    create_SES_channels_index_lookup_dictionary()
    
    # SET THE min_rtl_power_frequency_hz AND max_rtl_power_frequency_hz BASED ON SES_channels, RANGE_DRIFT_OFFSET_HZ, AND RTL_SDR_V4_RANGE_MIN & MAX
    # ...ensure there is at least 1Hz difference between min & max, else rtl_power will generate a file 0.5Gb large with a sample rate of 0Hz! Insert this 1Hz if it's needed.
    set_rtl_power_frequency_range()

def main():
    #python global statements (for assigning to our global variables)
    global SES_channels
    parse_SES_channels() #Just so the data structures get cleared nicely, and its a quick operation, do it again


    # QUERY SERVER TO DETERMINE ANY ADJUSTMENTS TO SQUELCH LEVEL VIA K (TODO, decent extra functionality but optional for now)

    # READ rtl_power_output.csv AND POPULATE rtl_power_output_temporal_samples WITH ALL AVAILABLE TEMPORAL SAMPLES
    # ...test for read failure
    read_and_populate_rtl_power_output_temporal_samples()

    # CALCULATE num_sliding_window_frequency_ranges AND sliding_windows_band_width_hz
    set_num_and_width_of_sliding_windows()

    # CALCULATE sliding_windows_thresholds_above_noise_floor_db THRESHOLDS FOR CHANNEL ACTIVITY
    # ...slide the windows along, for each movement collate a number of samples of SLIDING_WINDOWS_TARGET_NUM_SAMPLES_PER_AVERAGE and calculate a
    # ...(minimum_average_signal_strength + (associated_standard_deviation * K)) <-- K is a constant factor
    # ...once done sliding, the smallest of these values per window should become its sliding_windows_thresholds_above_noise_floor_db entry
    set_sliding_windows_thesholds_above_noise_floor_db()

    # TUNE SES_channels TO NEAREST rtl_power_output_temporal_samples' spectrum_decibel_datapoints INDEX
    # ...ACCOUNT FOR RTL_SDR_V4_tuning_hz OFFSET
    # ...set each SES_channels' index_to_spectrum_decibel_datapoints with this index
    tune_SES_channels_to_rtl_power_output()

    # FOR EACH SESChannel IN SES_channels WALK THROUGH rtl_power_output_temporal_samples AT YOUR index_to_spectrum_decibel_datapoints
    # ...IF spectrum_decibel_datapoints[index_to_spectrum_decibel_datapoints] > or < relevant sliding_windows_thresholds_above_noise_floor_db
    # ...based on your current signal_is_currently_above_threshold, potentially generate a UtilizationState in utilization_states
    generate_utilization_states()
    #print_which_channels_have_utilization() #DEBUG

    # FOR EACH SESChannel IN SES_channels RECORD THE MAX SIGNAL STRENGTH rtl_power_output_temporal_samples AT YOUR index_to_spectrum_decibel_datapoints
    # ...AS THE SignalStrengthSample ENTRY IN YOUR signal_strength_samples
    #record_signal_strength_samples()
    #print('LAST SAMPLES:') #DEBUG
    #print_signal_strength_samples_for_observed_channels() #DEBUG
    record_max_signal_strength_samples()
    print('MAX_STRENGTH_SAMPLES:') #DEBUG
    print_signal_strength_samples_for_observed_channels() #DEBUG

    pass #DEBUG breakpoint handle

    # EMPTY rtl_power_output_temporal_samples AND sliding_windows_thresholds_above_noise_floor_db,
    # ...AND RESET EACH CHANNEL'S signal_is_currently_above_threshold TO None NOW THAT PROCESSING IS DONE
    reset_state_for_next_rtl_power_read()

    # FOR EACH SESChannel IN SES_channels WITH DATA, REPRESENT IN JSON THE CONTENTS OF YOUR utilization_states AND signal_strength_samples
    # ...AND INCLUDE message_id AND address AND soc-id METADATA
    # ...THEN POST JSON DATA TO THE SERVER AT DATA_ENDPOINT_FOR_SERVER
    # ...upon successful upload, empty utilization_states and signal_strength_samples, and increment message_id
    json_data_to_upload = prepare_channel_data()
    if(upload_data(json_data_to_upload)):
        global message_id
        #empty channel data, and increment message_id
        for channel in SES_channels:
            channel.utilization_states = []
            channel.signal_strength_samples = []
        message_id += 1
    else:
        #data failed to upload D:
        pass

    # Hi Joseph! For threading & setting up a loop, note that the SESChannelList.csv should only be read once on start-up,
    # ...and any updates to targeting_VHF would require re-reading SESChannelList.csv so changes to these require that the program restarts.
    # ...What we're looping for is to get a new set of rtl_power_output_temporal_samples which we use to populate each channel's
    # ...utilization_states AND signal_strength_samples (which are emptied upon successful upload to the server).
    # ...regarding uploading to the server, it's up to you how you want to handle re-attempting that, it currently just tries once, 
    # ...by calling upload_data above this comment ^^ since it will need to abort in relationship to rtl_power's timing

    pass #DEBUG breakpoint handle

def copy_new_csv_data():
    current_directory = os.path.dirname(os.path.abspath(__file__))
    full_path_to_rtl_power_output = os.path.join(current_directory + '/' + RTL_POWER_OUTPUT_FOLDER_NAME, RTL_POWER_OUTPUT_FILE_NAME)
    full_path_to_rtl_power_in_progress = os.path.join(current_directory + '/' + RTL_POWER_OUTPUT_FOLDER_NAME, RTL_POWER_IN_PROGRESS_FILE_NAME)
    shutil.copyfile(full_path_to_rtl_power_in_progress, full_path_to_rtl_power_output)

if __name__ == "__main__":
    parse_SES_channels()
    first_time = False #So we don't parse the file on the first run
    while True:
        try:
            t1 = threading.Thread(target=main)
            if not first_time:
                first_time = True
                t1 = threading.Thread(target=print, args=("SKIPPING",))
            t2 = threading.Thread(target=run_rtl_power)
            t2.start()
            t1.start()

            t1.join()
            t2.join()

            copy_new_csv_data()
        except KeyboardInterrupt as e:
            raise(e)
        except:
            pass

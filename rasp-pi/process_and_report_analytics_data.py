import csv #reading .csv files
from typing import List #for providing type hints for lists

#component of SESChannel, represents a timestamp of a channel beginning use (start time) or ending use (stop time)
class UtilizationState:
    # CONSTRUCTOR
    def __init__(self, timestamp_unix: int, is_start_time: bool):
        self.timestamp_unix = timestamp_unix #stored as a UNIX timestamp (int)
        self.is_start_time = is_start_time #False = is_stop_time
    # REPORTING STATE AS STRING (debugging)
    def __repr__(self) -> str:
        return f"UtilizationState(timestamp_unix={self.timestamp_unix}, is_start_time={self.is_start_time})"

#component of SESChannel, represents a decibel value at a timestamp
class SignalStrengthSample:
    # CONSTRUCTOR
    def __init__(self, timestamp_unix: int, decibel_sample: float):
        self.timestamp_unix = timestamp_unix #stored as a UNIX timestamp (int)
        self.decibel_sample = decibel_sample
    # REPORTING STATE AS STRING (debugging)
    def __repr__(self) -> str:
        return f"SignalStrengthSample(timestamp_unix={self.timestamp_unix}, decibel_sample={self.decibel_sample})"

#SES Channels, with their base info from SESChannelList.csv, and processed data to send to the server
class SESChannel:
    # CONSTRUCTOR
    def __init__(self, name: str, frequency_hz: int):
        self.name = name
        self.name_clash: bool = False #set to True if this frequency has more than one name assigned to it in SESChannelList.csv
        self.frequency_hz = frequency_hz #in Hz (int)
        self.utilization_states: List[UtilizationState] = []
        self.signal_strength_samples: List[SignalStrengthSample] = []
    # REPORTING STATE AS STRING (debugging)
    def __repr__(self) -> str:
        return (f"SESChannel(name='{self.name}', frequency_hz={self.frequency_hz}, "
                f"utilization_states={self.utilization_states}, "
                f"signal_strength_samples={self.signal_strength_samples})") #these str concatenate

# CONSTANTS
RTL_SDR_V4_RANGE_MIN_HZ: int = 24000000 #24MHz (represented in Hz)
RTL_SDR_V4_RANGE_MAX_HZ: int = 1766000000 #1766MHz (represented in Hz)
VHF_RANGE_MIN_HZ: int = 30000000 #30MHz (represented in Hz)
VHF_RANGE_MAX_HZ: int = 300000000 #300MHz (represented in Hz)
UHF_RANGE_MIN_HZ: int = 300000000 #300MHz (represented in Hz)
UHF_RANGE_MAX_HZ: int = 3000000000 #3GHz (3000MHz) (represented in Hz)
TEST_RANGE_MIN_HZ: int = 477087500 #CB channel 67
TEST_RANGE_MAX_HZ: int = 477087500 #CB channel 67

# GLOBAL VARIABLES
targetting_VHF: bool = True #aiming to analyze Very High Frequency range, False means Ultra High Frequency range
targetting_test_range: bool = False #set to True to target the test range in CONSTANTS
min_frequency_hz: int #minimum frequency in range we're analyzing, -50000 Hz (accommodate frequency drift)
max_frequency_hz: int #maximum frequency in range we're analyzing, +50000 Hz (accommodate frequency drift)
min_distance_between_frequencies_hz: int #minimum distance between frequencies in the range we're analyzing
SES_channels: List[SESChannel] = [] #list of SES_channels, sorted by frequency, with no duplicate frequencies (if there is a name clash only one channel is recorded)


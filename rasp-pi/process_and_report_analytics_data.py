import csv #reading .csv files
from typing import List, Dict #for providing type hints for lists & dictionaries

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
        self.signal_is_currently_above_threshold: bool #for measuring flips in usage vs non-usage (TODO, consider the possibility of two utilization_states being a start_time or stop_time in a row for db processing!)
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

# CONSTANTS
RTL_SDR_V4_RANGE_MIN_HZ: int = 24000000 #24MHz (represented in Hz)
RTL_SDR_V4_RANGE_MAX_HZ: int = 1766000000 #1766MHz (represented in Hz)
VHF_RANGE_MIN_HZ: int = 30000000 #30MHz (represented in Hz)
VHF_RANGE_MAX_HZ: int = 300000000 #300MHz (represented in Hz)
UHF_RANGE_MIN_HZ: int = 300000000 #300MHz (represented in Hz)
UHF_RANGE_MAX_HZ: int = 3000000000 #3GHz (3000MHz) (represented in Hz)
TEST_RANGE_MIN_HZ: int = 477087500 #CB channel 67
TEST_RANGE_MAX_HZ: int = 477087500 #CB channel 67
RANGE_DRIFT_OFFSET_HZ: int = 50000 #0.05MHz (represented in Hz), subtract from min_frequency_hz, add to max_frequency_hz
SLIDING_WINDOWS_TEMPORAL_LENGTH_UNIX: int = 10 #window is sliding in 10 second intervals from the first temporal sample in rtl_power_output_temporal_samples
SLIDING_WINDOWS_BAND_SIZE_MAX_HZ: int = 2000000 #2MHz (represented in Hz), maximum size of sliding window bands

# GLOBAL VARIABLES
targetting_VHF: bool = True #aiming to analyze Very High Frequency range, False means Ultra High Frequency range
targetting_test_range: bool = False #set to True to target the test range in CONSTANTS
min_frequency_hz: int #minimum frequency in range we're analyzing, -50000 Hz (accommodate frequency drift)
max_frequency_hz: int #maximum frequency in range we're analyzing, +50000 Hz (accommodate frequency drift)
min_distance_between_frequencies_hz: int #minimum distance between frequencies in the range we're analyzing
SES_channels: List[SESChannel] = [] #list of SES_channels, sorted by frequency, with no duplicate frequencies (if there is a name clash only one channel is recorded)
SES_channels_index_lookup_dictionary: Dict[int, int] = {} #query a frequency and get an index to it in SES_channels, or None if it doesn't exist (use .get)
RTL_SDR_V4_tuning_hz: int = 0 #if RTL-SDR is out of tune, its measurements will be adjusted by this value to align with SES_channels frequencies
rtl_power_output_temporal_samples: List[RTLPowerOutputTemporalSample] = [] #samples moving forward in time, with the spectrum's decibel values per time slice (TODO, adjust docs as this is no longer a 2D array)
num_sliding_windows: int #number of sliding windows (<= SLIDING_WINDOWS_BAND_SIZE_MAX_HZ each) to cover our analysis range
# ...num_sliding_windows = math.ceil(range_hz / SLIDING_WINDOWS_BAND_SIZE_MAX_HZ)
sliding_windows_band_width_hz: int #the actual band width of our sliding windows (<= SLIDING_WINDOWS_BAND_SIZE_MAX_HZ)
# ...range_hz / num_sliding_windows
sliding_windows_thresholds_above_noise_floor_db: List[float] #threshold above which we consider channels in this window 'in use'
# ...index into your appropriate sliding window threshold here with: 
# ...int((channel_frequency_hz - min_frequency_hz) / sliding_windows_band_width_hz)

# (WORK IN PROGRESS) DOESN'T RUN rtl_power YET OR RERUN rtl_power WITH THREADING
# ...aka works on a static pre-generated data file without temporal or threading aspects (TODO)
def main():
    # QUERY SERVER TO DETERMINE IF targeting_VHF (TODO, add to docs too)

    # USE A KNOWN STRONG FREQUENCY TO SET RTL_SDR_V4_tuning_hz, IF RTL-SDR IS OUT OF TUNE (TODO, add to docs too)

    # READ SESChannelList.csv AND POPULATE SES_channels WITH CHANNELS WITHIN OUR RANGE (VHF, UHF, test) (SEE CONSTANTS FOR RANGES)
    # ...test for read failure

    # SORT SES_channels BY FREQUENCY

    # PARSE SES_channels AND REMOVE ANY DUPLICATE FREQUENCIES (MARKING THE KEPT CHANNEL AS A name_clash)

    # PARSE SES_channels AND RECORD THE min_distance_between_frequencies_hz

    # PARSE SES_channels AND CREATE SES_channels_index_lookup_dictionary ENTRIES FOR FREQUENCIES -> INDEXES (INTO SES_channels)
    
    # SET THE min_frequency_hz AND max_frequency_hz BASED ON SES_channels, RANGE_DRIFT_OFFSET_HZ, AND RTL_SDR_V4_RANGE_MIN & MAX
    # ...ensure there is at least 1Hz difference between min & max, else rtl_power will generate a file 0.5Gb large with a sample rate of 0Hz! Insert this 1Hz if it's needed.

    # READ rtl_power_output.csv AND POPULATE rtl_power_output_temporal_samples WITH ALL AVAILABLE TEMPORAL SAMPLES
    # ...test for read failure

    # CALCULATE num_sliding_windows AND sliding_windows_band_width_hz

    # CALCULATE sliding_windows_thresholds_above_noise_floor_db THRESHOLDS FOR CHANNEL ACTIVITY
    # ...slide the windows along, for each movement a distance of SLIDING_WINDOWS_TEMPORAL_LENGTH_UNIX calculate a
    # ...(minimum_average_signal_strength + (associated_standard_deviation * K)) <-- K is a constant factor, we will use 2
    # ...once done sliding, the smallest of these values per window should become its sliding_windows_thresholds_above_noise_floor_db entry

    # TUNE SES_channels TO NEAREST rtl_power_output_temporal_samples' spectrum_decibel_datapoints INDEX
    # ...ACCOUNT FOR RTL_SDR_V4_tuning_hz OFFSET
    # ...set each SES_channels' index_to_spectrum_decibel_datapoints with this index

    # FOR EACH SESChannel IN SES_channels WALK THROUGH rtl_power_output_temporal_samples AT YOUR index_to_spectrum_decibel_datapoints
    # ...IF spectrum_decibel_datapoints[index_to_spectrum_decibel_datapoints] > or < relevant sliding_windows_thresholds_above_noise_floor_db
    # ...based on your current signal_is_currently_above_threshold, potentially generate a UtilizationState in utilization_states

    # FOR EACH SESChannel IN SES_channels RECORD THE VERY LAST rtl_power_output_temporal_samples AT YOUR index_to_spectrum_decibel_datapoints
    # ...AS THE SignalStrengthSample ENTRY IN YOUR signal_strength_samples

    # FOR EACH SESChannel IN SES_channels REPRESENT IN JSON THE CONTENTS OF YOUR utilization_states AND signal_strength_samples
    # ...AND UPLOAD IT TO THE SERVER AT POST /data
    # ...upon successful upload, empty utilization_states and signal_strength_samples

    pass

if __name__ == "__main__":
    main()
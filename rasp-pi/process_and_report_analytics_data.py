import csv #reading .csv files
from typing import List #for providing type hints for lists

#component of SESChannel, represents a timestamp of a channel beginning use (start time) or ending use (stop time)
class UtilizationState:
    # CONSTRUCTOR
    def __init__(self, timestamp: int, is_start_time: bool):
        self.timestamp = timestamp #stored as a UNIX timestamp (int)
        self.is_start_time = is_start_time #false = is_stop_time
    # REPORTING STATE AS STRING (debugging)
    def __repr__(self) -> str:
        return f"UtilizationState(timestamp={self.timestamp}, is_start_time={self.is_start_time})"

#component of SESChannel, represents a decibel value at a timestamp
class SignalStrengthSample:
    # CONSTRUCTOR
    def __init__(self, timestamp: int, decibel_sample: float):
        self.timestamp = timestamp #stored as a UNIX timestamp (int)
        self.decibel_sample = decibel_sample
    # REPORTING STATE AS STRING (debugging)
    def __repr__(self) -> str:
        return f"SignalStrengthSample(timestamp={self.timestamp}, decibel_sample={self.decibel_sample})"

#SES Channels, with their base info from SESChannelList.csv, and processed data to send to the server
class SESChannel:
    # CONSTRUCTOR
    def __init__(self, name: str, frequency: int):
        self.name = name
        self.frequency = frequency #in Hz (int)
        self.utilization_states: List[UtilizationState] = []
        self.signal_strength_samples: List[SignalStrengthSample] = []
    # REPORTING STATE AS STRING (debugging)
    def __repr__(self) -> str:
        return (f"SESChannel(name='{self.name}', frequency={self.frequency}, "
                f"utilization_states={self.utilization_states}, "
                f"signal_strength_samples={self.signal_strength_samples})") #these str concatenate

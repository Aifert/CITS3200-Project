import time
import random
import os

RTL_POWER_OUTPUT_PROCESS_FILE_NAME = 'rtl_power_in_progress.csv'
RTL_POWER_OUTPUT_FOLDER_NAME = 'rtl_powerOutput'
RTL_POWER_ORIG_PROCESS_FILE_NAME = 'rtl_power_output_orig.csv'

current_directory = os.path.dirname(os.path.abspath(__file__))
full_path_to_channel_list = os.path.join(current_directory + '/' + RTL_POWER_OUTPUT_FOLDER_NAME, RTL_POWER_OUTPUT_PROCESS_FILE_NAME)
orig_file_path = os.path.join(current_directory + '/' + RTL_POWER_OUTPUT_FOLDER_NAME, RTL_POWER_ORIG_PROCESS_FILE_NAME)
with open(orig_file_path, 'r') as base_file:
	with open(full_path_to_channel_list, 'w') as file:
		newOutput = base_file.read()
		newOutput = newOutput.replace(str(random.randint(15, 40)), "0")
		time.sleep(10)
		file.write(newOutput)
		file.close()
	file.close()
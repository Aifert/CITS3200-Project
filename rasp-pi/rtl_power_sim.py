import time
import random
import os
from datetime import datetime

RTL_POWER_OUTPUT_PROCESS_FILE_NAME = 'rtl_power_in_progress.csv'
RTL_POWER_OUTPUT_FOLDER_NAME = 'rtl_powerOutput'
RTL_POWER_ORIG_PROCESS_FILE_NAME = 'rtl_power_output_orig.csv'

current_directory = os.path.dirname(os.path.abspath(__file__))
full_path_to_channel_list = os.path.join(current_directory + '/' + RTL_POWER_OUTPUT_FOLDER_NAME, RTL_POWER_OUTPUT_PROCESS_FILE_NAME)
orig_file_path = os.path.join(current_directory + '/' + RTL_POWER_OUTPUT_FOLDER_NAME, RTL_POWER_ORIG_PROCESS_FILE_NAME)
with open(orig_file_path, 'r') as base_file:
	with open(full_path_to_channel_list, 'w') as file:
		newOutput = base_file.read()
		newOutput = newOutput.replace("-3", "-9")
		print(str(datetime.now().hour)+":"+str(datetime.now().minute-1)+":")
		print(int(time.time()))
		newOutput = newOutput.replace("01:38:", str(datetime.now().hour)+":"+str(datetime.now().minute-1)+":")
		newOutput = newOutput.replace("01:39:", str(datetime.now().hour)+":"+str(datetime.now().minute)+":")
		newOutput = newOutput.replace(str(random.randint(15, 40)), "0")
		time.sleep(60)
		file.write(newOutput)
		file.close()
	file.close()
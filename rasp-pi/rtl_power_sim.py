import time

RTL_POWER_OUTPUT_PROCESS_FILE_NAME = 'rtl_power_output_in_progress.csv'
RTL_POWER_OUTPUT_FOLDER_NAME = 'rtl_powerOutput'

current_directory = os.path.dirname(os.path.abspath(__file__))
full_path_to_channel_list = os.path.join(current_directory + '/' + RTL_POWER_OUTPUT_FOLDER_NAME, RTL_POWER_OUTPUT_PROCESS_FILE_NAME)
with open(full_path_to_channel_list, 'w') as file:
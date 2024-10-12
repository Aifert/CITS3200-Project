import requests
import time
#serverURL = 'https://cits3200-d5bhb7d7gaeqg2b0.australiacentral-01.azurewebsites.net/sdr/pipe_stream'
serverURL = 'http://192.168.20.20:9000/sdr/tune?deviceId=1'
API_KEY: str = 'aifert-MDUtOVxi1wK_ry9qZyr5OCSTjzu7RUGcvy1_YfHyXSw'
headers = {
	"Content-Type": "stream",
	"Authorization": f"Bearer {API_KEY}",
}

freqStore = 0

while True:
	x = requests.get(serverURL, headers=headers).json()
	if "data" in x:
		newFreq = x["data"]["freq"]
		if newFreq != freqStore:
			url = f'http://localhost:4001/tune?freq={newFreq}'
			requests.get(url)
			freqStore=newFreq
	time.sleep(1)

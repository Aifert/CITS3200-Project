import requests
import time
import hashlib #for hashing the MAC address of SoC, a portion of which will be sent as our soc-id
import uuid #for receiving MAC address of SoC to hash & send a portion of the digest as our soc-id
mac = uuid.getnode()
hashed_mac = hashlib.sha256(str(mac).encode()).hexdigest()
soc_id = int(hashed_mac[:4], 16)
#serverURL = 'https://cits3200-d5bhb7d7gaeqg2b0.australiacentral-01.azurewebsites.net/sdr/pipe_stream'
serverURL = 'http://192.168.20.20:9000/sdr/tune?deviceId=1'
API_KEY: str = 'aifert-MDUtOVxi1wK_ry9qZyr5OCSTjzu7RUGcvy1_YfHyXSw'
headers = {
	"Content-Type": "stream",
	"Authorization": f"Bearer {API_KEY}",
	"device-id": str(soc_id),
}

freqStore = 0

while True:
	x = requests.get(serverURL, headers=headers).json()
	print(x)
	if "data" in x and "freq" in x["data"]:
		newFreq = x["data"]["freq"]
		print(newFreq)
		if newFreq != freqStore:
			url = f'http://localhost:4001/tune?freq={newFreq}'
			requests.get(url)
			freqStore=newFreq
	time.sleep(1)

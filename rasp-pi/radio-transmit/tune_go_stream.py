import requests
import time
serverURL = 'http://192.168.20.20:9000/sdr/tune?deviceId=1'
API_KEY: str = 'aifert-MDUtOVxi1wK_ry9qZyr5OCSTjzu7RUGcvy1_YfHyXSw'
headers = {
	"Content-Type": "steam",
	"Authorization": f"Bearer {API_KEY}",
}

while True:
	print("SENDING")
	x = requests.get(serverURL, headers=headers).json()
	if "data" in x:
		print(x)
		newFreq = x["data"]["freq"]
		url = 'http://localhost:4001/tune?file=test-3.mp3'
		requests.get(url)
	time.sleep(10)

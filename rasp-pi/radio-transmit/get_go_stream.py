import requests
import time
import hashlib #for hashing the MAC address of SoC, a portion of which will be sent as our soc-id
import uuid #for receiving MAC address of SoC to hash & send a portion of the digest as our soc-id
def get_stream(url):
	mac = uuid.getnode()
	hashed_mac = hashlib.sha256(str(mac).encode()).hexdigest()
	soc_id = int(hashed_mac[:4], 16)
	print(soc_id)
	s = requests.Session()
	while True:
		try:
			with s.get(url, headers=None, stream=True) as resp:
				lastFrame = ""
				for line in resp.iter_content(8192):
					if line:
						#serverURL = 'https://cits3200-d5bhb7d7gaeqg2b0.australiacentral-01.azurewebsites.net/sdr/pipe_stream'
						serverURL = 'http://192.168.20.20:9000/sdr/pipe_stream'
						API_KEY: str = 'aifert-MDUtOVxi1wK_ry9qZyr5OCSTjzu7RUGcvy1_YfHyXSw'
						headers = {
						"Content-Type": "application/octet-stream",
						"Authorization": f"Bearer {API_KEY}",
						"Device-Id": str(soc_id),
						}
						requests.post(serverURL, data=line, headers=headers, timeout=5, verify=False)
		except:
			time.sleep(10)
				

url = 'http://localhost:4001/stream'
get_stream(url)

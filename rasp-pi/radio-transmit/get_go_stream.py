import requests
import time
def get_stream(url):
	s = requests.Session()

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
				}
				requests.post(serverURL, data=line, headers=headers, timeout=5, verify=False)
				

url = 'http://localhost:4001/stream'
get_stream(url)

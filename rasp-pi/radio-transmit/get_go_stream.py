import requests

def get_stream(url):
    s = requests.Session()

    with s.get(url, headers=None, stream=True) as resp:
        for line in resp.iter_lines():
            if line:
                print(line)

url = 'http://localhost:4001/stream'
get_stream(url)
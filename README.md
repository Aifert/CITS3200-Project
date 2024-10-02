# CITS3200-Project

Quick-access hyperlinks:

- [JIRA Board](https://cits3200team5.atlassian.net/jira/software/projects/SCRUM/boards/1)
- [Project Outline](https://uniwa-my.sharepoint.com/:w:/r/personal/23408841_student_uwa_edu_au/_layouts/15/Doc.aspx?sourcedoc=%7B5D3EBC7B-4245-4875-B1CF-AA6C431C241A%7D&file=CITS3200%20-%20Radio%20Project.docx&action=default&mobileredirect=true)

| UWA ID   | Name           | Github Username |
| -------- | -------------- | --------------- |
| 23455873 | Aifert Yet     | Aifert          |
| 23408841 | Arnav Dangmali | GravityWorld    |
| 23012728 | Henry Hewgill  | HenryHewgill    |
| 22705919 | Jakem Pinchin  | JakePinchin     |
| 23334811 | Joseph Newman  | RedBlueCarrots  |
| 23165388 | Sigmund Howe   | SigHowe         |

---

### Scope
The Remote Radio Monitoring Solution (RRMS) is for DFES to access radio streams and analytics from a web browser.
### Architecture Overview
![RRMS Data Flow Diagram](RRMS.jpg)

## Getting Started / Installation Guide

### Prerequisites (for your local machine)
- Docker

For hosting on your own web server
- Virtual Machine
- Nginx on your Virtual Machine

1. **Clone the Respository**:
```bash
git clone https://github.com/GravityWorld/CITS3200-Project.git

cd CITS3200-Project
```

2. **Start up Docker**

**Make sure you have Docker Desktop Installed**

- MAC - https://docs.docker.com/desktop/install/mac-install/
- Windows - https://docs.docker.com/desktop/install/windows-install/
- Linux - https://docs.docker.com/desktop/install/linux-install/

Before continuing make sure the docker desktop you've downloaded is running, run it by double clicking on it.

If you are using WSL on windows, activate WSL by doing in terminal

```bash
wsl
```

Then

(For Production)
```bash
docker-compose up --build
```

(For development)
```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Web Server configuration

A Web server has been made available.

To host it on your own Virtual Machine (Assuming you are currently in your virtual machine)

Install Nginx if you haven't already by doing
```bash
sudo apt update
sudo apt install nginx

sudo systemctl start nginx
sudo systemctl enable nginx

cd /etc/nginx/sites-available/
```

To use entraID, you need to generate a self-signed SSL certificate and configure Nginx to use it.
```bash
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/self-signed.key \
  -out /etc/nginx/self-signed.crt

sudo openssl dhparam -out /etc/nginx/dhparam.pem 2048
```

Write this in your cits3200_project Nano and save it
```bash
sudo nano /etc/nginx/sites-available/cits3200_project

server {
    listen 80;
    server_name 20.213.23.98;

    return 301 https://$host$request_uri;
}

# HTTPS Server for Frontend Application on port 3000
server {
    listen 3000 ssl;
    server_name 20.213.23.98;

    ssl_certificate /etc/nginx/self-signed.crt;
    ssl_certificate_key /etc/nginx/self-signed.key;
    ssl_dhparam /etc/nginx/dhparam.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers "ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256";

    # Proxy for frontend application
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTPS Server for SDR Service on port 4000
server {
    listen 4000 ssl;
    server_name 20.213.23.98;

    ssl_certificate /etc/nginx/self-signed.crt;
    ssl_certificate_key /etc/nginx/self-signed.key;
    ssl_dhparam /etc/nginx/dhparam.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers "ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256";

    # Proxy for SDR service
    location / {
        proxy_pass http://127.0.0.1:4001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTPS Server for Backend Service on port 9000
server {
    listen 9000 ssl;
    server_name 20.213.23.98;

    ssl_certificate /etc/nginx/self-signed.crt;
    ssl_certificate_key /etc/nginx/self-signed.key;
    ssl_dhparam /etc/nginx/dhparam.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers "ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-GCM-SHA256";

    # Proxy for backend service
    location / {
        proxy_pass http://127.0.0.1:9001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Configuration for port pipeline
server {
    listen 8000;
    server_name 20.213.23.98;

    location / {
        proxy_pass http://127.0.0.1:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

	proxy_connect_timeout 600;
	proxy_send_timeout 600;
	proxy_read_timeout 600;
	send_timeout 600;
    }
}
```
Then save it and run

```bash
sudo ln -s /etc/nginx/sites-available/cits3200_project /etc/nginx/sites-enabled/
sudo systemctl reload nginx
```

Install docker by doing
```bash
sudo apt install docker.io
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```


You can start web server by doing (Make sure you are in the clone project directory)

If you want to set up CI/CD before starting add these env values to your .env file
```bash
sudo nano .env
```

```bash
AZURE_AD_CLIENT_ID=***
AZURE_AD_CLIENT_SECRET=***
AZURE_AD_TENANT_ID=***
NEXTAUTH_SECRET=***
DISCORD_WEBHOOK_URL=***
GITHUB_USERNAME=Aifert
GITHUB_REPO=GravityWorld/CITS3200-Project
GITHUB_SECRET=***
PROJECT_DIR=~/CITS3200-Project
branch=main
```

Then you also need a `.env.local` file in frontend directory
```bash
sudo nano frontend/.env.local
```

```bash
NEXTAUTH_URL=https://<public_ip>:3000/
NEXT_PUBLIC_BACKEND_URL=https://<public_ip>:9000/
NEXT_PUBLIC_FRONTEND_URL=https://<public_ip>:3000/
NEXT_PUBLIC_SDR_URL=https://<public_ip>:4000/
```

Finally run the deploy script
```bash
chmod +x deploy.sh

./deploy.sh
````

and the application should be available at `https://<your_server_ip>:3000`

Our server is hosted on these credentials

- IP : 20.213.23.98
- Ports available : [3000, 4000, 9000]

Sample request you can make to interact with webserver

```https://20.213.23.98:9000```

```https://20.213.23.98:3000/login```


## Instructions to start frontend is available in `frontend/README.md`

### NodeJS Unit Testing

Unit testing has been set up in NodeJS using jest

Unit tests can be run simply with

```bash
npm test
```

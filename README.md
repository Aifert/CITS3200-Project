# CITS3200-Project

Quick-access hyperlinks:

- [JIRA Board](https://cits3200team5.atlassian.net/jira/software/projects/SCRUM/boards/1)
- [Project Outline](https://uniwa-my.sharepoint.com/:w:/r/personal/23408841_student_uwa_edu_au/_layouts/15/Doc.aspx?sourcedoc=%7B5D3EBC7B-4245-4875-B1CF-AA6C431C241A%7D&file=CITS3200%20-%20Radio%20Project.docx&action=default&mobileredirect=true)

|UWA ID  |Name          |Github Username|
|--------|--------------|---------------|
|23455873|Aifert Yet    |Aifert         |
|23408841|Arnav Dangmali|GravityWorld   |
|23012728|Henry Hewgill |HenryHewgill   |
|22705919|Jakem Pinchin |JakePinchin    |
|23334811|Joseph Newman |RedBlueCarrots |
|23165388|Sigmund Howe  |SigHowe        |


## Getting Started / Installation Guide

### Prerequisites
- Python 3.8+
- pip
- Docker

1. **Clone the Respository**:
```bash
$ git clone https://github.com/GravityWorld/CITS3200-Project.git

$ cd CITS3200-Project #Enter into cloned repository
```

2. **Start up Docker**

**Make sure you have Docker Desktop Installed**

- MAC - https://docs.docker.com/desktop/install/mac-install/
- Windows - https://docs.docker.com/desktop/install/windows-install/
- Linux - https://docs.docker.com/desktop/install/linux-install/

Before continuing make sure the docker desktop you've downloaded is running, run it by double clicking on it.

If you are using WSL on windows, activate WSL by doing in terminal

```bash
$ wsl
```

Then

```bash
$ docker-compose up --build
```

3. **Connect to db**

**Default credentials for db is user: user, password: password, to connect**

Open your docker desktop, click into `CITS3200-Project`, then click into `postgres:13`, then click `Exec`

```bash
$ psql -U user -d mydb
```

OR alternatively, open a Terminal and do

```
$ docker exec -it cits3200-project-db-1 bash

$ psql -U user -d mydb
```


This will launch the web application. You should be able to see status of application in your terminal.

Changes made will be automatically updated, so you do not have to keep restarting docker.

The application will be available at `http://127.0.0.1:8000/`

### Web Server configuration

A Web server has been made available.

To host it on your own Virtual Machine (Assuming you are currently in your virtual machine)

You can start it by doing

```bash
$ sudo docker-compose up --build
```

and the application should be available at `http://<your_server_ip>:8000`

Our server is hosted on these credentials

- IP : 20.213.23.98
- Ports available : [8000, 5001]

Sample request you can make to interact with webserver

```http://20.213.23.98:8000```

#!/bin/bash

docker-compose up --build -d

sudo apt install npm

sudo npm i -g pm2

pm2 deploy server.js

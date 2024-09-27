#!/bin/bash

sudo docker-compose up --build -d

sudo apt install npm

sudo npm i -g pm2

cd deploy && npm i && pm2 start deploy.js

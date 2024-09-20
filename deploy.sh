#!/bin/bash

sudo docker-compose up --build -d

sudo apt install npm

sudo npm i -g pm2

cd deploy && pm2 deploy server.js

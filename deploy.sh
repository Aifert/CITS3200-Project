#!/bin/bash

sudo docker-compose build --no-cache

sudo docker-compose up -d

sudo apt install npm

sudo npm i -g pm2

cd deploy && npm i && pm2 start deploy.js

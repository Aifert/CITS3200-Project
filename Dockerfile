FROM node:18-alpine

RUN apk add --no-cache bash git

WORKDIR /app

COPY package*.json ./

RUN npm install -g nodemon

RUN npm install

COPY . .

EXPOSE 8000

ENTRYPOINT [ "nodemon", "backend/server.js" ]

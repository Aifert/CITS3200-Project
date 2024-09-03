FROM node:18-alpine

RUN apk add --no-cache bash git

WORKDIR /app

COPY package*.json ./

# RUN npm install -g nodemon

RUN npm ci --only=production

COPY . .

EXPOSE 6000

ENTRYPOINT [ "node", "backend/server.js" ]

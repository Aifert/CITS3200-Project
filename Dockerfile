FROM node:18-alpine

WORKDIR /src

COPY package*.json ./

RUN npm install -g nodemon

RUN npm install

COPY . .

EXPOSE 8000

ENTRYPOINT [ "nodemon","backend/server.js" ]
CMD ["npm", "run", "dev"]

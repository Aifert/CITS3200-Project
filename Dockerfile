FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Install dependencies
RUN npm install

RUN npm install -g nodemon

# Copy all the source files
COPY . .

# Expose necessary ports
EXPOSE 9000
EXPOSE 5000
EXPOSE 3000

# Default to production if NODE_ENV is not set
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Use nodemon in development
CMD ["sh", "-c", "if [ '$NODE_ENV' = 'development' ]; then nodemon backend/server.js; else node backend/server.js; fi"]

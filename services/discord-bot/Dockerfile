FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm install -g ts-node typescript

CMD ["ts-node", "index.ts"]

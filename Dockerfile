FROM node:20.9.0-bookworm

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install -g npm@latest
RUN npm install --omit=dev
COPY . .

EXPOSE 3000

CMD ["npm", "run", "start"]
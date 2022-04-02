FROM node:17-slim

RUN apt-get update && apt-get install sox libsox-fmt-mp3 -y

WORKDIR /spotify-radio/

COPY package.json package-lock.json /spotify-radio/

RUN npm i

COPY . .

USER node

CMD npm run dev
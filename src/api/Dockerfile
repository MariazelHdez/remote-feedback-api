FROM node:20.1.0-alpine3.17


RUN npm install -g pm2@latest

WORKDIR /usr/src/app
COPY package.json /usr/src/app/package.json
RUN npm install
RUN npm install -g nodemon


COPY ./ ./

CMD npm run start
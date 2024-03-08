FROM node:16.14.0-alpine


RUN npm install -g pm2@latest

WORKDIR /usr/src/app
COPY package.json /usr/src/app/package.json
RUN npm install
RUN npm install -g nodemon


COPY ./ ./

CMD npm run start
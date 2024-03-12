FROM node:20.1.0-alpine3.17

RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN mkdir /home/node/app && chown -R node:node /home/node/app

COPY --chown=node:node ./package*.json /home/node/
RUN npm install -g npm@8.5.5
USER node

WORKDIR /home/node/app
RUN npm install && npm cache clean --force --loglevel=error

COPY --chown=node:node . /home/node/app/

RUN npm run build:api

EXPOSE 3000

WORKDIR /home/node/app

ENV NODE_ENV=development
CMD [ "node", "./dist/index.js" ]
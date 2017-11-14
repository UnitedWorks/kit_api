FROM node:6.9.2

RUN mkdir -p /usr/src/kit_api
ADD package.json /usr/src/kit_api/package.json

RUN cd /usr/src/kit_api && npm install && npm install knex -g

WORKDIR /usr/src/kit_api
COPY . /usr/src/kit_api

EXPOSE 5000

CMD ["npm", "start"]

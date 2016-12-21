FROM node:6.9.2

RUN mkdir -p /usr/src/kit_api
WORKDIR /usr/src/kit_api

COPY . /usr/src/kit_api
RUN npm install

EXPOSE 5000

CMD ["npm", "start"]

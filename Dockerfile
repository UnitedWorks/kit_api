FROM node:6.9.2

RUN mkdir -p /usr/src/mayorapi
WORKDIR /usr/src/mayorapi

COPY . /usr/src/mayorapi
RUN npm install

EXPOSE 5000

CMD ["npm", "start"]

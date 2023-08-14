FROM node:latest

WORKDIR /usr/src/app
COPY . ./
RUN npm ci

EXPOSE 3000

CMD [ "npm" , "start" ]
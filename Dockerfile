FROM node:16-alpine

WORKDIR /usr/src/app

RUN apk update
RUN apk add file

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 3000

CMD ["sh", "_run_app.sh"]

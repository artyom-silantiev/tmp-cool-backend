FROM node:16-alpine

WORKDIR /app

RUN apk update && apk add file && apk add --no-cache docker-cli

COPY package*.json ./
COPY yarn.lock .

RUN yarn

COPY . .

RUN npx prisma generate
RUN yarn web:build

EXPOSE 3000

CMD ["sh", "_run_app.sh"]

## Description

Backend system, for the base nestjs project.
System components:

- web - rest api

External components:

...

## Run for dev

```bash
docker-compose up -d
yarn
yarn devs
yarn start:web:dev
```

## Deploy for production

```bash
# install
yarn

# .env file
yarn cli:env:setup
# or copy from .env.default
cp .env.default .env
nano .env # CHECK and EDIT

# [OPTIONAL] if used db, redis, s3 from docker
docker-compose up -d

# db migrates
yarn migrate_prod

# db seeder
yarn cli:seeder

# build
yarn build:all
sh build_frontend_main.sh

# deploy apps
cp cluster.config.def.js cluster.config.js
nano cluster.config.js # CHECK and EDIT
node cluster.js generate_pm2_config
nano pm2.config.js
pm2 start pm2.config.js
```

## Build main app

```bash
cd <backend dir>
sh build_frontend_main.sh
```

## Running the app

```bash
# development
$ yarn start:web

# watch mode
$ yarn start:web:dev

# production mode
$ yarn start:web:prod
```

## Test

```bash
# unit tests
$ yarn test

# e2e tests
$ yarn test:e2e

# test coverage
$ yarn test:cov
```

# prisma orm commands

## create migration only

```sh
npx prisma migrate dev --name <name> --create-only
```

## apply not used migrations

```sh
npx prisma migrate dev
```

## create and apply migration (!!!)

```sh
npx prisma migrate dev --name <name>
```

## prisma generate (update types)

```sh
npx prisma generate
```

## prisma reset (ONLY FOR DEV!!!(!!!)) (drop and recreate db from migrations)

```sh
npx prisma migrate reset
```

## migrations docs

https://www.prisma.io/docs/concepts/components/prisma-migrate
https://www.prisma.io/docs/guides/application-lifecycle/developing-with-prisma-migrate/advanced-migrate-scenarios

## Devs commands

```sh
npx ts-node -r tsconfig-paths/register _apps/cli/src/_cmd.ts -- env:print_default
npx ts-node -r tsconfig-paths/register _apps/cli/src/_cmd.ts -- env:setup
```

## Ports in project

- web: 3000 - 3099

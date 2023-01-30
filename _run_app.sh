#/usr/bin/sh
sleep 10
yarn migrate_prod
yarn cli:seeder
yarn generate
#yarn build:web
#yarn start:web:prod
yarn start:web:dev

#/usr/bin/sh

sleep 5
yarn migrate_prod
yarn cli:seeder

if [ "$NODE_ENV" == "development" ]; then
  yarn web:dev
elif [ "$NODE_ENV" == "production" ]; then
  yarn web:prod
fi


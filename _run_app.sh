#/usr/bin/sh
sleep 5
npm run migrate_prod
npm run cli:seeder
npm run generate
#npm run build:web
#npm run start:web:prod
npm run start:web:dev

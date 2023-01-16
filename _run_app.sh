#/usr/bin/sh
sleep 10
npm run migrate_prod
npm run cli:seeder
npx run generate
npm run build:web
npm run start:web:prod

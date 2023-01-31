#/usr/bin/sh
sleep 5
npm run migrate_prod
npm run cli:seeder
npm run generate
#npm run web:build
#npm run web:prod
npm run web:dev

import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';

import { CommonModule } from './modules/common/common.module';
import { GuestModule } from './modules/guest/guest.module';
import { UserModule } from './modules/user/user.module';
import { FilesRouteModule } from './modules/files/files.module';
import { AuthModule } from '@share/modules/auth/auth.module';

import { useEnv } from '@share/lib/env/env';
import * as fs from 'fs-extra';
import {
  ServeStaticModule,
  ServeStaticModuleOptions,
} from '@nestjs/serve-static';

import { AuthMiddleware } from '@share/modules/auth/auth.middleware';
import { BackupsModule } from './modules/admin/backups/backups.module';

@Module({
  imports: [
    AuthModule,

    // Routes Modules
    CommonModule,
    GuestModule,
    UserModule,
    FilesRouteModule,
    BackupsModule,

    RouterModule.register([
      {
        path: 'api/admin/backups',
        module: BackupsModule,
      },
      {
        path: 'api/guest',
        module: GuestModule,
      },
      {
        path: 'api/user',
        module: UserModule,
      },
      {
        path: 'files',
        module: FilesRouteModule,
      },
    ]),

    ServeStaticModule.forRootAsync({
      useFactory: async () => {
        const env = useEnv();
        console.log(env.DIR_ASSETS_PUBLIC);

        const options = [
          {
            rootPath: env.DIR_ASSETS_PUBLIC,
            serveRoot: '/static_b',
          },
        ] as ServeStaticModuleOptions[];

        try {
          const stat = await fs.stat(env.DIR_FRONT_APP_MAIN);
          if (stat.isDirectory) {
            options.push({
              rootPath: env.DIR_FRONT_APP_MAIN,
              renderPath: '/*',
              // exclude: ['/content*', '/sha256*', '/api*', '/static_b'],
            });
          }
        } catch (error) {}

        return options;
      },
    }),
  ],
})
export class AppRouterModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: '/api/*', method: RequestMethod.ALL });
  }
}

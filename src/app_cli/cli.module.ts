import { CommandModule } from 'nestjs-command';
import { Module } from '@nestjs/common';
import { DbModule } from '@db/db.module';
import { DbFixCommand } from './db-fix.command';
import { ClusterCommand } from './cluster.command';
import { ClusterAppModule } from '@share/modules/cluster-app/cluster-app.module';
import { SeederCommand } from './seeder.command';
import { ClusterAppType } from '@share/lib/env/env';

@Module({
  imports: [
    ClusterAppModule.register(ClusterAppType.Cli),
    CommandModule,
    DbModule
  ],
  controllers: [],
  providers: [SeederCommand, DbFixCommand, ClusterCommand],
})
export class CliModule { }

import { Module } from '@nestjs/common';
import { FilesModule } from '@share/modules/files/files.module';
import { FilesController } from './files.controller';

@Module({
  imports: [FilesModule],
  controllers: [FilesController],
})
export class FilesRouteModule {}

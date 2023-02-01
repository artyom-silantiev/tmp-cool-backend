import { Module } from '@nestjs/common';
import { LocalFilesModule } from '@share/modules/local_files/local_files.module';
import { FilesController } from './files.controller';

@Module({
  imports: [LocalFilesModule],
  controllers: [FilesController],
})
export class FilesRouteModule {}

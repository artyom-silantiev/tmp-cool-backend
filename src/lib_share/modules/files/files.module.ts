import { DbModule } from '@db/db.module';
import { Module } from '@nestjs/common';
import { FilesInputService } from './files-input.service';
import { FilesMakeService } from './files-make.service';
import { FilesOutputService } from './files-output.service';

@Module({
  imports: [DbModule],
  providers: [FilesMakeService, FilesInputService, FilesOutputService],
  exports: [FilesMakeService, FilesInputService, FilesOutputService],
})
export class FilesModule {}

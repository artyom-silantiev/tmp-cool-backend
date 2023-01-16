import { DbModule } from '@db/db.module';
import { Module } from '@nestjs/common';
import { ClearDataService } from './clear-data.service';

@Module({
  imports: [DbModule],
  providers: [ClearDataService],
  exports: [ClearDataService],
})
export class ClearDataModule { }

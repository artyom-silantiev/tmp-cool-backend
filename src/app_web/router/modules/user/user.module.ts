import { DbModule } from '@db/db.module';
import { Module } from '@nestjs/common';
import { AppMailerModule } from '@share/modules/app-mailer/app-mailer.module';
import { AuthModule } from '@share/modules/auth/auth.module';
import { ClearDataModule } from '@share/modules/clear-data/clear-data.module';
import { JwtModule } from '@share/modules/jwt/jwt.module';
import { LocalFilesModule } from '@share/modules/local_files/local_files.module';
import { UserController } from './user.controller';

@Module({
  imports: [
    DbModule,
    AuthModule,
    AppMailerModule,
    JwtModule,
    LocalFilesModule,
    ClearDataModule,
  ],
  controllers: [UserController],
})
export class UserModule { }

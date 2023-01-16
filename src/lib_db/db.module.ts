import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { UserRepository } from './repositories/user.repository';
import { JwtRepository } from './repositories/jwt.repository';
import { TaskRepository } from './repositories/task.repository';
import { LocalFileRepository } from './repositories/local-file.repository';
import { ImageRepository } from './repositories/image.repository';
import { SettingRepository } from './repositories/setting.repository';

@Module({
  providers: [
    PrismaService,
    SettingRepository,
    JwtRepository,
    TaskRepository,
    LocalFileRepository,
    ImageRepository,
    UserRepository,
  ],
  exports: [
    PrismaService,
    SettingRepository,
    JwtRepository,
    TaskRepository,
    LocalFileRepository,
    ImageRepository,
    UserRepository,
  ],
})
export class DbModule { }

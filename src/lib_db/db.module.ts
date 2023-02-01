import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { UserRepository } from './repositories/user.repository';
import { JwtRepository } from './repositories/jwt.repository';
import { TaskRepository } from './repositories/task.repository';
import { FileRepository } from './repositories/file.repository';
import { SettingRepository } from './repositories/setting.repository';
import { FileRefRepository } from './repositories/file_ref.repository';

@Module({
  providers: [
    PrismaService,
    SettingRepository,
    JwtRepository,
    TaskRepository,
    FileRepository,
    FileRefRepository,
    UserRepository,
  ],
  exports: [
    PrismaService,
    SettingRepository,
    JwtRepository,
    TaskRepository,
    FileRepository,
    FileRefRepository,
    UserRepository,
  ],
})
export class DbModule {}

import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { File, FileRef } from '@prisma/client';
import { FileWrap } from '@share/modules/local_files/types';

export type FileRow = File & {
  refs?: FileRef[];
};

@Injectable()
export class FileRepository {
  constructor(private prisma: PrismaService) {}

  get R() {
    return this.prisma.fileRef;
  }

  async getLocalFileById(id: bigint) {
    const localFile = await this.prisma.file.findFirst({
      where: {
        id,
      },
    });
    return localFile || null;
  }

  async getFileRefDbByUid(uid: string) {
    const fileRef = await this.prisma.fileRef.findFirst({
      where: {
        uid,
      },
      include: {
        file: true,
      },
    });

    if (!fileRef) {
      throw new HttpException('', 404);
    }

    return { status: 200, file: fileRef.file };
  }
}

import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { File, FileRef } from '@prisma/client';

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

  async getFileDbBySha256(sha256: string) {
    const file = await this.prisma.file.findFirst({
      where: {
        sha256,
      },
    });

    if (!file) {
      throw new HttpException('', 404);
    }

    return { status: 200, file: file };
  }
}

import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LocalFile, Image } from '@prisma/client';

export type LocalFileRow = LocalFile & {
  Images?: Image[];
  ThumbsAsOrg?: LocalFile[];
  ThumbsAsThumb?: LocalFile[];
};

@Injectable()
export class LocalFileRepository {
  constructor(private prisma: PrismaService) {}

  get R() {
    return this.prisma.localFile;
  }

  async getLocalFileById(id: bigint) {
    const localFile = await this.prisma.localFile.findFirst({
      where: {
        id,
      },
    });
    return localFile || null;
  }

  async getLocalFileBySha256Hash(sha256: string) {
    const localFile = await this.prisma.localFile.findFirst({
      where: {
        sha256,
      },
    });

    if (!localFile) {
      throw new HttpException('', 404);
    }

    return { status: 200, localFile };
  }

  async getThumbs(localFile: LocalFile) {
    const localFileThumbs = await this.prisma.localFileThumb.findMany({
      where: {
        orgLocalFileId: localFile.id,
      },
    });
    return localFileThumbs;
  }
}

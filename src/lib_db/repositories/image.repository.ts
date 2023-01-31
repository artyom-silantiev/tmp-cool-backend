import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Image, ImageStorage, LocalFile, User } from '@prisma/client';

export type ImageRow = Image & {
  Users?: User[];
  LocalFile?: LocalFile;
};

@Injectable()
export class ImageRepository {
  constructor(private prisma: PrismaService) {}

  get R() {
    return this.prisma.image;
  }

  async createByLocalFile(localFile: LocalFile) {
    const image = await this.prisma.image.create({
      data: {
        storage: ImageStorage.LocalFile,
        localFileId: localFile.id,
      },
      include: {
        LocalFile: true,
      },
    });

    return image;
  }
}

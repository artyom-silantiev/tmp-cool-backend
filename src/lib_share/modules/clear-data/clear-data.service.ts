import { PrismaService } from '@db/prisma.service';
import { Injectable } from '@nestjs/common';
import { MediaType } from '@prisma/client';
import * as fs from 'fs-extra';
import * as path from 'path';
import { useEnv } from '@share/lib/env/env';
import { LocalFilesDefs } from '../local_files/defs';

@Injectable()
export class ClearDataService {
  private env = useEnv();

  constructor(private prisma: PrismaService) {}

  async safeDeleteUserById(userId: bigint) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
      },
      include: {
        image: true,
      },
    });

    if (!user) {
      throw new Error('user not found');
    }

    if (user.image) {
      await this.deleteImageById(user.image.id);
    }

    await this.prisma.jwt.deleteMany({
      where: {
        userId: user.id,
      },
    });

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        email: `:deleted:${userId.toString()}:`,
        deletedAt: new Date(),
      },
    });
  }

  async deleteImageById(imageId: bigint) {
    const image = await this.prisma.fileRef.findUnique({
      where: {
        id: imageId,
      },
      include: {
        file: true,
      },
    });

    await this.prisma.fileRef.delete({
      where: {
        id: image.id,
      },
    });

    await this.tryDeleteFileDbById(image.file.id);
  }

  async tryDeleteFileDbById(
    fileDbId: bigint,
    params?: {
      ignoreImageId?: bigint;
    },
  ) {
    const file = await this.prisma.file.findFirst({
      where: {
        id: fileDbId,
      },
      include: {
        refs: true,
      },
    });

    let fileRefs = file.refs ? file.refs : [];
    if (params && params.ignoreImageId) {
      fileRefs = fileRefs.filter((v) => v.id !== params.ignoreImageId);
    }

    console.log('fileRefs', fileRefs);

    if (fileRefs.length > 0) {
      return false;
    }

    const absPathToFile = path.resolve(LocalFilesDefs.DIR, file.pathToFile);
    await fs.remove(absPathToFile);

    await this.prisma.file.delete({
      where: {
        id: file.id,
      },
    });
  }
}

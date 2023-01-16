import { PrismaService } from '@db/prisma.service';
import { Injectable } from '@nestjs/common';
import { ImageStorage, MediaType } from '@prisma/client';
import * as fs from 'fs-extra';
import * as path from 'path';
import { useEnv } from '@share/lib/env/env';

@Injectable()
export class ClearDataService {
  private env = useEnv();

  constructor(
    private prisma: PrismaService,
  ) { }

  async safeDeleteUserById(userId: bigint) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
      },
      include: {
        Image: true,
      },
    });

    if (!user) {
      throw new Error('user not found');
    }

    if (user.Image) {
      await this.deleteImageById(user.Image.id);
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
    const image = await this.prisma.image.findUnique({
      where: {
        id: imageId,
      },
      include: {
        LocalFile: true,
      },
    });

    await this.prisma.image.delete({
      where: {
        id: image.id,
      },
    });

    if (image.storage === ImageStorage.LocalFile) {
      await this.tryDeleteLocalFileById(image.LocalFile.id);
    }
  }

  async tryDeleteLocalFileById(
    localFileId: bigint,
    params?: {
      ignoreImageId?: bigint;
      ignoreThumbOrgId?: bigint;
    },
  ) {
    const localFile = await this.prisma.localFile.findFirst({
      where: {
        id: localFileId,
      },
      include: {
        Images: true,
        ThumbsAsOrg: {
          where: {
            orgLocalFileId: {
              not: localFileId,
            },
          },
        },
      },
    });

    let localFileImages = localFile.Images ? localFile.Images : [];
    if (params && params.ignoreImageId) {
      localFileImages = localFileImages.filter(
        (v) => v.id !== params.ignoreImageId,
      );
    }

    let localFilesThumbsOrg = localFile.ThumbsAsOrg
      ? localFile.ThumbsAsOrg
      : [];
    if (params && params.ignoreThumbOrgId) {
      localFilesThumbsOrg = localFilesThumbsOrg.filter(
        (v) => v.id !== params.ignoreThumbOrgId,
      );
    }

    if (localFileImages.length > 0 || localFilesThumbsOrg.length > 0) {
      return false;
    }

    // delete thumbs ...
    if (localFile.type === MediaType.IMAGE && !localFile.isThumb) {
      const localFileThumbs = await this.prisma.localFileThumb.findMany({
        where: {
          orgLocalFileId: localFile.id,
        },
      });

      for (const localFileThumb of localFileThumbs) {
        await this.tryDeleteLocalFileById(localFileThumb.thumbLocalFileId, {
          ignoreThumbOrgId: localFile.id,
        });
      }

      await this.prisma.localFileThumb.deleteMany({
        where: {
          orgLocalFileId: localFile.id,
        },
      });
    }

    if (localFile.isThumb) {
      await this.prisma.localFileThumb.deleteMany({
        where: {
          thumbLocalFileId: localFile.id,
        },
      });
    }

    const absPathToFile = path.resolve(
      this.env.DIR_LOCAL_FILES,
      localFile.pathToFile,
    );
    await fs.remove(absPathToFile);

    await this.prisma.localFile.delete({
      where: {
        id: localFile.id,
      },
    });
  }
}

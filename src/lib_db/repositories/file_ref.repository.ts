import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { FileRef, File, User } from '@prisma/client';
import { useBs58 } from '@share/lib/bs58';

export type FileRefRow = FileRef & {
  users?: User[];
  file?: File;
};

@Injectable()
export class FileRefRepository {
  constructor(private prisma: PrismaService) {}

  get R() {
    return this.prisma.fileRef;
  }

  async createByFile(fileDb: File) {
    const fileLink = await this.prisma.fileRef.create({
      data: {
        uid: useBs58().uid(),
        fileId: fileDb.id,
      },
      include: {
        file: true,
      },
    });

    return fileLink;
  }
}

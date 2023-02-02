import { HttpException, Injectable } from '@nestjs/common';
import { FileRequest } from './files_request';
import { FilesMakeService } from './files-make.service';
import { File, MediaType } from '@prisma/client';
import { FileRepository } from '@db/repositories/file.repository';
import { PrismaService } from '@db/prisma.service';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs-extra';
import { useEnv } from '@share/lib/env/env';
import { useCacheFiles } from '@share/lib/cache/local-file';
import { FilesDefs } from './defs';

export type FileMeta = {
  absPathToFile: string;
  contentType: MediaType;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  durationSec: number | null;
  sha256: string;
  isThumb?: boolean;
  orgId?: string;
  createdAt: Date | string;
};

const env = useEnv();

@Injectable()
export class FilesOutputService {
  private cacheFileDb = useCacheFiles();

  constructor(
    private prisma: PrismaService,
    private fileRepository: FileRepository,
    private localFilesMake: FilesMakeService,
  ) {}

  getFileMetaFromFileDb(fileDb: File) {
    const absPathToFile = path.resolve(FilesDefs.DIR, fileDb.pathToFile);

    const fileMeta = {
      absPathToFile,
      sha256: fileDb.sha256,
      contentType: fileDb.type,
      mime: fileDb.mime,
      size: fileDb.size,
      width: fileDb.width || null,
      height: fileDb.height || null,
      durationSec: fileDb.durationSec || null,
      createdAt: fileDb.createdAt,
    } as FileMeta;

    return fileMeta;
  }

  async getFileDbPathByFileRefRequest(fileRefRequest: FileRequest) {
    const uid = fileRefRequest.uid;

    const cacheFileDbMetaRaw = await this.cacheFileDb.get(fileRefRequest);
    if (cacheFileDbMetaRaw) {
      const fileMeta = JSON.parse(cacheFileDbMetaRaw) as FileMeta;
      return { status: 200, fileMeta };
    }

    const tmpFileRef = await this.fileRepository.getFileRefDbByUid(uid);
    let fileMeta: FileMeta;
    let status = tmpFileRef.status;

    if (fileRefRequest.thumb) {
      if (tmpFileRef.file.type !== MediaType.IMAGE) {
        throw new HttpException(
          'thumbs size param for not thumbs allow object',
          406,
        );
      }

      const orgFile = tmpFileRef.file;

      if (fileRefRequest.normalizeThumb(orgFile.width, orgFile.height)) {
        fileMeta = this.getFileMetaFromFileDb(tmpFileRef.file);
      }

      const thumbFile = fileRefRequest.getThumbFile(orgFile);
      if (!fileMeta) {
        // get thumb from FS
        try {
          if (fs.existsSync(thumbFile.file)) {
            fileMeta = await fs.readJSON(thumbFile.meta);
          }
        } catch (error) {}
      }

      if (!fileMeta) {
        fileMeta = await this.localFilesMake.createNewThumbForLocalFile(
          orgFile,
          fileRefRequest.thumb,
          thumbFile,
        );
        status = 208;
      }
    } else {
      fileMeta = this.getFileMetaFromFileDb(tmpFileRef.file);
    }

    await this.cacheFileDb.set(
      fileRefRequest,
      Object.assign(fileMeta, { status: 200 }),
    );

    return { status, fileMeta: fileMeta };
  }
}

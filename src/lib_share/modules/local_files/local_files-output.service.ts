import { HttpException, Injectable } from '@nestjs/common';
import { FileRefRequest, ThumbParam } from './file_ref_request';
import { LocalFilesMakeService } from './local_files-make.service';
import { File, FileRef, MediaType } from '@prisma/client';
import { FileRepository } from '@db/repositories/file.repository';
import { PrismaService } from '@db/prisma.service';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs-extra';
import { useEnv } from '@share/lib/env/env';
import { useCacheLocalFile } from '@share/lib/cache/local-file';
import { LocalFilesDefs } from './defs';

export type FileMeta = {
  absPathToFile: string;
  sha256: string;
  contentType: MediaType;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  durationSec: number | null;
  createdAt: Date | string;
};

const env = useEnv();

@Injectable()
export class LocalFilesOutputService {
  private cacheFileDb = useCacheLocalFile();

  constructor(
    private prisma: PrismaService,
    private fileRepository: FileRepository,
    private localFilesMake: LocalFilesMakeService,
  ) {}

  getThumbFile(file: File, thumb: ThumbParam) {
    const part1 = file.sha256.substring(0, 3);
    const thumbDir = path.resolve(env.DIR_TEMP, 'images_thumbs', part1);
    const thumbName = `${file.sha256}.${thumb.type}.${thumb.name}`;
    return {
      dir: thumbDir,
      file: path.resolve(thumbDir, thumbName),
      meta: path.resolve(thumbDir, `${thumbName}.meta`),
    };
  }

  getFileMetaFromFileDb(fileDb: File) {
    const absPathToFile = path.resolve(LocalFilesDefs.DIR, fileDb.pathToFile);

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

  async getFileDbPathByFileRefRequest(fileRefRequest: FileRefRequest) {
    const uid = fileRefRequest.uid;

    const cacheFileDbMetaRaw = await this.cacheFileDb.get(fileRefRequest);
    if (cacheFileDbMetaRaw) {
      const fileMeta = JSON.parse(cacheFileDbMetaRaw) as FileMeta;
      return { status: 200, fileMeta };
    }

    const tmpFileRef = await this.fileRepository.getFileRefDbByUid(uid);
    let fileMeta: FileMeta;
    let status = tmpFileRef.status;

    console.log('fileRefRequest.thumb', fileRefRequest.thumb);

    if (fileRefRequest.thumb) {
      if (tmpFileRef.file.type !== MediaType.IMAGE) {
        throw new HttpException(
          'thumbs size param for not thumbs allow object',
          406,
        );
      }

      const thumb = fileRefRequest.thumb;
      const orgFile = tmpFileRef.file;

      if (thumb.type === 'width') {
        thumb.name = FileRefRequest.parseThumbSize(
          parseInt(thumb.name),
          orgFile.width,
          env.LOCAL_FILES_CACHE_MIN_THUMB_LOG_SIZE,
        );
      } else if (thumb.type === 'name') {
        if (thumb.name === 'fullhd') {
          if (orgFile.width > 1920 || orgFile.height > 1920) {
            // noting
          } else {
            fileMeta = this.getFileMetaFromFileDb(tmpFileRef.file);
          }
        }
      }

      const thumbFile = this.getThumbFile(orgFile, thumb);
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
          thumb,
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

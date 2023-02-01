import { HttpException, Injectable } from '@nestjs/common';
import { LocalFilesRequest } from './local_files_request';
import { StandardResult } from '@share/standard-result.class';
import { LocalFilesMakeService } from './local_files-make.service';
import { LocalFile, MediaType } from '@prisma/client';
import { LocalFileRepository } from '@db/repositories/local-file.repository';
import { PrismaService } from '@db/prisma.service';
import * as _ from 'lodash';
import * as path from 'path';
import { useEnv } from '@share/lib/env/env';
import { useCacheLocalFile } from '@share/lib/cache/local-file';
import { LocalFilesDefs } from './defs';

export type LocalFileMeta = {
  status: number;
  absPathToFile: string;
  sha256: string;
  contentType: MediaType;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  durationSec: number | null;
  isThumb: boolean;
  createdAt: Date;
};

@Injectable()
export class LocalFilesOutputService {
  private env = useEnv();
  private cacheLocalFile = useCacheLocalFile();

  constructor(
    private prisma: PrismaService,
    private localFileRepository: LocalFileRepository,
    private localFilesMake: LocalFilesMakeService,
  ) {}

  async getLocalFilePathByLocalFilesRequest(
    localFilesRequest: LocalFilesRequest,
  ) {
    const sha256 = localFilesRequest.sha256;

    const cacheLocalFileMetaRaw = await this.cacheLocalFile.get(
      localFilesRequest,
    );

    if (cacheLocalFileMetaRaw) {
      const cacheLocalFileMeta = JSON.parse(
        cacheLocalFileMetaRaw,
      ) as LocalFileMeta;
      return cacheLocalFileMeta;
    }

    const tmpLocalFile =
      await this.localFileRepository.getLocalFileBySha256Hash(sha256);

    let localFileWrap: { status: number; localFile: LocalFile };
    if (localFilesRequest.thumb && !tmpLocalFile.localFile.isThumb) {
      if (tmpLocalFile.localFile.type !== MediaType.IMAGE) {
        throw new HttpException(
          'thumbs size param for not thumbs allow object',
          406,
        );
      }

      const thumb = localFilesRequest.thumb;
      if (thumb.type === 'width') {
        thumb.name = LocalFilesRequest.parseThumbSize(
          parseInt(thumb.name),
          tmpLocalFile.localFile.width,
          this.env.LOCAL_FILES_CACHE_MIN_THUMB_LOG_SIZE,
        );
      } else if (thumb.type === 'name') {
        if (thumb.name === 'fullhd') {
          if (
            tmpLocalFile.localFile.width > 1920 ||
            tmpLocalFile.localFile.height > 1920
          ) {
            // noting
          } else {
            localFileWrap = tmpLocalFile;
          }
        }
      }

      if (!localFileWrap) {
        const localFileThumb = await this.prisma.localFileThumb.findFirst({
          where: {
            orgLocalFileId: tmpLocalFile.localFile.id,
            thumbName: thumb.name,
          },
          include: {
            ThumbLocalFile: true,
          },
        });

        if (localFileThumb) {
          localFileWrap = {
            status: 200,
            localFile: localFileThumb.ThumbLocalFile,
          };
        }
      }

      if (!localFileWrap) {
        const createdThumb =
          await this.localFilesMake.createNewThumbForLocalFile(
            tmpLocalFile.localFile,
            thumb,
          );

        localFileWrap = createdThumb;
      }
    } else {
      localFileWrap = tmpLocalFile;
    }

    const localFile = localFileWrap.localFile;
    const absPathToFile = path.resolve(
      LocalFilesDefs.DIR,
      localFile.pathToFile,
    );
    const localFileMeta = {
      status: localFileWrap.status,
      absPathToFile,
      sha256: localFile.sha256,
      contentType: localFile.type,
      mime: localFile.mime,
      size: localFile.size,
      width: localFile.width || null,
      height: localFile.height || null,
      durationSec: localFile.durationSec || null,
      isThumb: localFile.isThumb,
      createdAt: localFile.createdAt,
    } as LocalFileMeta;

    await this.cacheLocalFile.set(
      localFilesRequest,
      Object.assign(localFileMeta, { status: 200 }),
    );

    return localFileMeta;
  }
}

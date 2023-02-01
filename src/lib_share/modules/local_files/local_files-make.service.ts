import { HttpException, Injectable } from '@nestjs/common';
import { File, MediaType } from '@prisma/client';

import * as moment from 'moment';
import * as _ from 'lodash';
import * as path from 'path';
import * as sharp from 'sharp';
import * as fs from 'fs-extra';
import { FileRepository } from '@db/repositories/file.repository';
import { PrismaService } from '@db/prisma.service';
import { ThumbParam } from './file_ref_request';
import { getMediaContentProbe } from '@share/ffmpeg';
import { getMimeFromPath, getFileSha256 } from '@share/helpers';
import { useEnv } from '@share/lib/env/env';
import { useBs58 } from '@share/lib/bs58';
import { LocalFilesDefs } from './defs';
import { FileWrap } from './types';
import { FileMeta } from './local_files-output.service';

@Injectable()
export class LocalFilesMakeService {
  private env = useEnv();
  private bs58 = useBs58();

  constructor(
    private prisma: PrismaService,
    private localFileRepository: FileRepository,
  ) {}

  async createFileDb(
    tempFile: string,
    params?: {
      thumbData?: {
        orgFileDbId: bigint;
        name: string;
      };
      noValidation?: boolean;
    },
  ): Promise<FileWrap> {
    const fileSha256Hash = await getFileSha256(tempFile);

    let fileWrap: FileWrap;
    try {
      fileWrap = await this.localFileRepository.getFileRefDbByUid(
        fileSha256Hash,
      );
    } catch {}
    if (fileWrap) {
      await fs.remove(tempFile);
      return { ...fileWrap, ...{ status: 208 } };
    }

    const mime = await getMimeFromPath(tempFile);
    const fstat = await fs.stat(tempFile);

    let contentType = MediaType.OTHER as MediaType;
    if (_.startsWith(mime, 'image/')) {
      contentType = MediaType.IMAGE;
    } else if (_.startsWith(mime, 'audio/')) {
      contentType = MediaType.AUDIO;
    } else if (_.startsWith(mime, 'video/')) {
      contentType = MediaType.VIDEO;
    }

    let size,
      width = null,
      height = null,
      duration = null,
      frameRate = 0;

    if (contentType === MediaType.IMAGE) {
      const imageInfo = await sharp(tempFile).metadata();
      size = fstat.size;
      width = imageInfo.width;
      height = imageInfo.height;
    } else if (contentType === MediaType.AUDIO) {
      const fileProbe = await getMediaContentProbe(tempFile);
      const stream = fileProbe.audioStreams[0];

      size = fileProbe.format.size;
      duration = parseFloat(stream.duration);
    } else if (contentType === MediaType.VIDEO) {
      const fileProbe = await getMediaContentProbe(tempFile);
      const stream = fileProbe.videoStreams[0];

      size = fileProbe.format.size;
      width = stream.width;
      height = stream.height;
      duration = parseFloat(stream.duration);
      frameRate = parseFloat(stream.r_frame_rate);
    }

    if (!params || !params.noValidation) {
    }

    if (params && params.thumbData) {
      if (contentType !== MediaType.IMAGE) {
        await fs.remove(tempFile);
        throw new HttpException('bad org content type for create thumb', 500);
      }
    }

    const now = moment();
    const year = now.format('YYYY');
    const month = now.format('MM');
    const day = now.format('DD');
    const locaFiles = LocalFilesDefs.DIR;
    const locDirForFile = path.join(year, month, day);
    const absDirForFile = path.resolve(locaFiles, locDirForFile);
    const locPathToFile = path.join(locDirForFile, fileSha256Hash);
    const absPathToFile = path.resolve(absDirForFile, fileSha256Hash);
    await fs.mkdirs(absDirForFile);
    await fs.move(tempFile, absPathToFile, { overwrite: true });

    const file = await this.prisma.file.create({
      data: {
        sha256: fileSha256Hash,
        mime,
        size,
        width,
        height,
        durationSec: Math.floor(duration),
        pathToFile: locPathToFile,
        type: contentType,
      },
    });

    fileWrap = {
      status: 201,
      file: file,
    };

    return fileWrap;
  }

  async createNewThumbForLocalFile(
    orgFile: File,
    thumb: ThumbParam,
    thumbFile: {
      dir: string;
      file: string;
      meta: string;
    },
  ) {
    const tempNewThumbImageFile = path.resolve(
      this.env.DIR_TEMP,
      this.bs58.uid() + '.thumb.jpg',
    );
    const absFilePath = path.resolve(LocalFilesDefs.DIR, orgFile.pathToFile);
    const image = sharp(absFilePath);
    const metadata = await image.metadata();

    let info: sharp.OutputInfo;
    if (thumb.type === 'width') {
      info = await image
        .resize(parseInt(thumb.name))
        .jpeg({ quality: 50 })
        .toFile(tempNewThumbImageFile);
    } else if (thumb.type === 'name') {
      if (thumb.name === 'fullhd') {
        if (metadata.height > metadata.width) {
          info = await image
            .resize({ height: 1920 })
            .jpeg({ quality: 50 })
            .toFile(tempNewThumbImageFile);
        } else {
          info = await image
            .resize({ width: 1920 })
            .jpeg({ quality: 50 })
            .toFile(tempNewThumbImageFile);
        }
      }
    }

    await fs.mkdirs(thumbFile.dir);
    await fs.move(tempNewThumbImageFile, thumbFile.file);
    const thumbMeta = {
      absPathToFile: thumbFile.file,
      sha256: orgFile.sha256,
      contentType: MediaType.IMAGE,
      mime: 'image/jpeg',
      size: info.size,
      width: info.width,
      height: info.height,
      durationSec: null,
      createdAt: new Date().toISOString(),
    } as FileMeta;
    await fs.writeJSON(thumbFile.meta, thumbMeta);

    return thumbMeta;
  }
}

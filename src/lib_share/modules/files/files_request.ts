import { File } from '@prisma/client';
import { useEnv } from '@share/lib/env/env';
import { resolve } from 'path';
import { FilesDefs } from './defs';

export type ThumbParam = {
  type: 'width' | 'name';
  name: string | null;
};

const env = useEnv();
export type FileRequestType = 'video' | 'image' | 'audio';

export class FileRequest {
  type = null as FileRequestType | null;
  format = null as string | null;
  uid: string;
  thumb: ThumbParam;

  constructor(
    uid: string,
    params?: {
      type?: FileRequestType | null;
      format?: string | null;
      thumb?: ThumbParam;
    },
  ) {
    this.uid = uid;
    if (params) {
      if (params.type) {
        this.type = params.type;
      }
      if (params.format) {
        this.format = params.format;
      }
      if (params.thumb) {
        this.thumb = params.thumb;
      }
    }
  }

  normalizeThumb(width: number, height: number) {
    if (this.thumb.type === 'width') {
      this.thumb.name = FileRequest.parseThumbSize(
        parseInt(this.thumb.name),
        width,
        env.LOCAL_FILES_CACHE_MIN_THUMB_LOG_SIZE,
      );
    } else if (this.thumb.type === 'name') {
      if (this.thumb.name === 'fullhd') {
        if (width > 1920 || height > 1920) {
          // noting
        } else {
          return true;
        }
      }
    }
    return false;
  }

  getThumbFile(file: File) {
    const part1 = `${this.thumb.type}.${this.thumb.name}`;
    const part2 = (file.id % BigInt(16)).toString();
    const thumbDir = resolve(
      FilesDefs.DIR_IMAGES_THUMBS,
      part1,
      part2,
      file.id.toString(),
    );
    return {
      file: resolve(thumbDir, 'file'),
      meta: resolve(thumbDir, 'meta.json'),
    };
  }

  static parseThumbSize(thumbsSize: number, width: number, minLog: number) {
    if (thumbsSize > width) {
      thumbsSize = width;
    }

    const sizeLog2 = Math.max(minLog, Math.floor(Math.log2(thumbsSize)));
    thumbsSize = Math.pow(2, sizeLog2);

    return thumbsSize.toString();
  }
}

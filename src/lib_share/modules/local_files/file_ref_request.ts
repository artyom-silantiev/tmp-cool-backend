export type ThumbParam = {
  type: 'width' | 'name';
  name: string | null;
};

export type FileRefRequestType = 'video' | 'image' | 'audio';

export class FileRefRequest {
  type = null as FileRefRequestType | null;
  format = null as string | null;
  uid: string;
  thumb: ThumbParam;

  constructor(
    uid: string,
    params?: {
      type?: FileRefRequestType | null;
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

  static parseThumbSize(thumbsSize: number, width: number, minLog: number) {
    if (thumbsSize > width) {
      thumbsSize = width;
    }

    const sizeLog2 = Math.max(minLog, Math.floor(Math.log2(thumbsSize)));
    thumbsSize = Math.pow(2, sizeLog2);

    return thumbsSize.toString();
  }
}

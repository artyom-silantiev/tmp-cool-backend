import { LocalFile } from '@prisma/client';

export type LocalFileWrap = {
  status: number;
  localFile: LocalFile;
};

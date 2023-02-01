import { File } from '@prisma/client';

export type FileWrap = {
  status: number;
  file: File;
};

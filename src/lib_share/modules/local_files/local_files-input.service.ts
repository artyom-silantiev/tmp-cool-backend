import { Injectable } from '@nestjs/common';
import { ImageRepository } from '@db/repositories/image.repository';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs-extra';
import { LocalFilesMakeService } from './local_files-make.service';
import { useEnv } from '@share/lib/env/env';
import { useBs58 } from '@share/lib/bs58';

@Injectable()
export class LocalFilesInputService {
  private env = useEnv();
  private bs58 = useBs58();

  constructor(
    private imageRepository: ImageRepository,
    private localFilesMake: LocalFilesMakeService,
  ) {}

  async init() {}

  async uploadImageByFile(imageFile: string) {
    const localFileWrap = await this.localFilesMake.createLocalFileByFile(
      imageFile,
    );

    const image = await this.imageRepository.createByLocalFile(
      localFileWrap.localFile,
    );

    return { status: 201, image };
  }

  async uploadImageByMulter(imageFile: Express.Multer.File) {
    const tempName = this.bs58.uid();
    const tempFile = path.resolve(this.env.DIR_TEMP, tempName);
    await fs.writeFile(tempFile, imageFile.buffer);
    return this.uploadImageByFile(tempFile);
  }
}

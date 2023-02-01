import { Injectable } from '@nestjs/common';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs-extra';
import { LocalFilesMakeService } from './local_files-make.service';
import { useEnv } from '@share/lib/env/env';
import { useBs58 } from '@share/lib/bs58';
import { FileRefRepository } from '@db/repositories/file_ref.repository';

@Injectable()
export class LocalFilesInputService {
  private env = useEnv();
  private bs58 = useBs58();

  constructor(
    private fileRefRepository: FileRefRepository,
    private localFilesMake: LocalFilesMakeService,
  ) {}

  async init() {}

  async uploadImageByFile(imageFile: string) {
    const fileWrap = await this.localFilesMake.createFileDb(imageFile);

    const imageRef = await this.fileRefRepository.createByFile(fileWrap.file);

    return { status: 201, imageRef };
  }

  async uploadImageByMulter(imageFile: Express.Multer.File) {
    const tempName = this.bs58.uid();
    const tempFile = path.resolve(this.env.DIR_TEMP, tempName);
    await fs.writeFile(tempFile, imageFile.buffer);
    return this.uploadImageByFile(tempFile);
  }
}

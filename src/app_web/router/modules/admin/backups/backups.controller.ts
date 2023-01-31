import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { BackupsService } from './backups.service';
import express from 'express';
import { AuthGuard } from '@share/modules/auth/auth.guard';
import { ACL, AclScopes } from '@share/modules/auth/acl.decorator';

@Controller()
@UseGuards(AuthGuard)
@ACL(AclScopes.allowAdmin)
export class BackupsController {
  constructor(private backupsService: BackupsService) {}

  onModuleInit() {}

  @Get('')
  async getBackups() {
    return await this.backupsService.getBackups();
  }

  @Get(':name')
  async downloadBackup(
    @Res() res: express.Response,
    @Param('name') name: string,
  ) {
    const absBackupFile = await this.backupsService.getAbsBackupFile(name);
    res.sendFile(absBackupFile);
  }

  @Post('')
  async createBackup() {
    const backupFileInfo = await this.backupsService.createBackup();
    return backupFileInfo;
  }

  @Post(':name')
  async useBackup(@Param('name') name: string) {
    await this.backupsService.restoreFromBackup(name);
    return '';
  }

  @Delete(':name')
  async deleteBackups(@Param('name') name: string) {
    await this.backupsService.deleteBackupFile(name);
    return '';
  }

  @Post('upload')
  uploadBackup() {
    return '';

    // TODO
  }
}

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
import { ApiTags } from '@nestjs/swagger';

@ApiTags('backups')
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
  async downloadBackup(@Res() res: express.Response, @Param() params) {
    const absBackupFile = await this.backupsService.getAbsBackupFile(
      params.name,
    );
    res.sendFile(absBackupFile);
  }

  @Post('')
  async createBackup() {
    const backupFileInfo = await this.backupsService.createBackup();
    return backupFileInfo;
  }

  @Post(':name')
  async restoreFromBackup(@Param() params) {
    await this.backupsService.restoreFromBackup(params.name);
    return `restored from ${params.name}`;
  }

  @Delete(':name')
  async deleteBackup(@Param() params) {
    await this.backupsService.deleteBackupFile(params.name);
    return `${params.name} deleted`;
  }

  @Post('upload')
  uploadBackup() {
    return '';

    // TODO
  }
}

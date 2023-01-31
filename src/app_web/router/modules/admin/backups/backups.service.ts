import { promisify } from 'node:util';
import { exec } from 'node:child_process';
import path from 'node:path';
import AdmZip from 'adm-zip';
import moment from 'moment';
import fs from 'fs-extra';
import { useEnv } from '@share/lib/env/env';
import { Injectable } from '@nestjs/common';

const asyncExec = promisify(exec);
const env = useEnv();

function getBackUpFileInfo(backupFileName: string) {
  const absFile = path.resolve(env.DIR_BACKUPS, backupFileName);

  const fileStat = fs.statSync(absFile);

  const backupFileInfo = {
    name: backupFileName,
    size: fileStat.size,
    createdAt: fileStat.birthtime,
  };

  return backupFileInfo;
}
type BackupFileInfo = ReturnType<typeof getBackUpFileInfo>;

@Injectable()
export class BackupsService {
  async onModuleInit() {}

  async getBackups() {
    const backupsFiles = [] as BackupFileInfo[];

    const files = fs.readdirSync(env.DIR_BACKUPS);

    for (const file of files) {
      const absFile = path.resolve(env.DIR_BACKUPS, file);
      const fileStat = fs.statSync(absFile);
      if ((fileStat.isFile(), file.replace(/^.*\.(.*)$/, '$1') === 'zip')) {
        const backupFileInfo = {
          name: file,
          size: fileStat.size,
          createdAt: fileStat.birthtime,
        };
        backupsFiles.push(backupFileInfo);
      }
    }

    return backupsFiles;
  }

  getAbsBackupFile(backupFileName: string) {
    const absFile = path.resolve(env.DIR_BACKUPS, backupFileName);
    return absFile;
  }

  async deleteBackupFile(backupFileName: string) {
    const absFile = path.resolve(env.DIR_BACKUPS, backupFileName);
    if (fs.existsSync(absFile)) {
      await fs.remove(absFile);
    }
  }

  private async createDbDump() {
    const dumpSqlFile = path.resolve(env.DIR_TEMP, `dump.sql`);

    const cmd = [
      'docker exec',
      `-t ${env.POSTGRES_HOST}`,
      'pg_dump',
      '--no-owner',
      `-U ${env.POSTGRES_USER}`,
      `-d ${env.POSTGRES_DB}`,
      `> ${dumpSqlFile}`,
    ].join(' ');

    await asyncExec(cmd);

    return dumpSqlFile;
  }

  async createBackup() {
    const dumpSqlFile = await this.createDbDump();

    const zip = new AdmZip();
    await zip.addLocalFile(dumpSqlFile);
    await zip.addLocalFolder(env.DIR_DATA, './data');
    await fs.remove(dumpSqlFile);

    const dataZip = path.resolve(
      env.DIR_BACKUPS,
      `backup-${moment().format('YYYY-MM-DD-HH-mm-ss')}.zip`,
    );

    await zip.writeZip(dataZip);

    const backupFileInfo = getBackUpFileInfo(dataZip);

    return backupFileInfo;
  }

  async restoreFromBackup(backupFile: string) {
    const absBackupFile = path.resolve(env.DIR_BACKUPS, backupFile);

    const backupDir = path.resolve(env.DIR_TEMP, `restore_${Date.now()}`);
    const zip = new AdmZip(absBackupFile);
    await zip.extractAllTo(backupDir);

    await this.restoreDataDir(backupDir);
    await this.restoreFromSqlDump(backupDir);
  }

  private async restoreFromSqlDump(backupDir: string) {
    const dumpSqlFile = path.resolve(backupDir, 'dump.sql');

    const cmd = [
      `cat ${dumpSqlFile} |`,
      'docker exec',
      `-i ${env.POSTGRES_HOST}`,
      'psql',
      `-U ${env.POSTGRES_USER}`,
      `-d ${env.POSTGRES_DB}`,
    ].join(' ');

    await asyncExec(cmd);
  }

  private async restoreDataDir(backupDir: string) {
    const newDataDir = path.resolve(backupDir, 'data');
    if (fs.existsSync(newDataDir) && fs.statSync(newDataDir).isDirectory()) {
      await fs.mkdirs(env.DIR_DATA);
      const appDataDir = path.resolve(env.DIR_DATA);
      const tempDataDir = path.resolve(env.DIR_TEMP, `old_data_${Date.now()}`);

      await fs.move(appDataDir, tempDataDir);
      await fs.move(newDataDir, appDataDir);
      await fs.remove(tempDataDir);
    }

    await fs.remove(backupDir);
  }
}

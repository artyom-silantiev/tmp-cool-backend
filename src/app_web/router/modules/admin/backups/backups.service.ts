import { promisify } from 'node:util';
import { exec } from 'node:child_process';
import { useEnv } from '@share/lib/env/env';
import { HttpException, Injectable } from '@nestjs/common';
import * as path from 'node:path';
import * as AdmZip from 'adm-zip';
import * as moment from 'moment';
import * as fs from 'fs-extra';
import { useRedis } from '@share/lib/redis';
import { useCacheLocalFile } from '@share/lib/cache/local-file';

const asyncExec = promisify(exec);
async function sh(cmd: string) {
  console.log('cmd: ', cmd);
  return await asyncExec(cmd);
}

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

const DB_DUMP_NAME = 'dump.sql';

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
    const dumpFile = path.resolve(env.DIR_TEMP, DB_DUMP_NAME);

    const cmd = [
      'docker exec',
      `-t ${env.POSTGRES_HOST}`,
      `pg_dump -U ${env.POSTGRES_USER} -d ${env.POSTGRES_DB}`,
      `> ${dumpFile}`,
    ].join(' ');

    await sh(cmd);

    return dumpFile;
  }

  async createBackup() {
    const dumpFile = await this.createDbDump();

    const zip = new AdmZip();
    await zip.addLocalFile(dumpFile);
    await zip.addLocalFolder(env.DIR_DATA, './data');
    await fs.remove(dumpFile);

    const curDate = moment().format('YYYY-MM-DD-HH-mm-ss');
    const backupFileName = `backup-${curDate}.zip`;
    const backupFile = path.resolve(env.DIR_BACKUPS, backupFileName);

    await zip.writeZip(backupFile);

    const backupFileInfo = getBackUpFileInfo(backupFileName);

    return backupFileInfo;
  }

  async restoreFromBackup(backupFile: string) {
    const absBackupFile = path.resolve(env.DIR_BACKUPS, backupFile);

    const backupDir = path.resolve(env.DIR_TEMP, `restore_${Date.now()}`);
    const zip = new AdmZip(absBackupFile);
    await zip.extractAllTo(backupDir);

    try {
      await this.restoreDataDir(backupDir);
      await this.restoreFromSqlDump(backupDir);
      await this.clearRedisCache();
      // self restart
      setTimeout(async () => {
        await sh(`docker restart ${env.NODE_HOST}`);
      }, 100);
    } catch (error) {
      console.error(error);
      await fs.remove(backupDir);
      throw new HttpException('', 500);
    }

    await fs.remove(backupDir);
  }

  private async restoreFromSqlDump(backupDir: string) {
    const dumpFile = path.resolve(backupDir, DB_DUMP_NAME);

    const cmds = [
      `docker cp ${dumpFile} ${env.POSTGRES_HOST}:/var`,
      `docker exec -i ${env.POSTGRES_HOST} dropdb -f -U ${env.POSTGRES_USER} ${env.POSTGRES_DB}`,
      `docker exec -i ${env.POSTGRES_HOST} createdb -U ${env.POSTGRES_USER} ${env.POSTGRES_DB}`,
      `docker exec -i ${env.POSTGRES_HOST} psql -U ${env.POSTGRES_USER} -d ${env.POSTGRES_DB} -f /var/${DB_DUMP_NAME}`,
      `docker exec -i ${env.POSTGRES_HOST} rm /var/${DB_DUMP_NAME}`,
    ];

    for (const cmd of cmds) {
      await sh(cmd);
    }
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
  }

  private async clearRedisCache() {
    const redis = useRedis();
    const cacheLocalFile = useCacheLocalFile();
    const keys = await redis.keys(cacheLocalFile.prefixKey());
    for (const key of keys) {
      console.log('key', key);
      await redis.del(key);
    }
  }
}

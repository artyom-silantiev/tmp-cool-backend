import { FileMeta } from '@share/modules/files/files-output.service';
import { FileRefRequest } from '@share/modules/files/files_request';
import { useRedis } from '../redis';

const prefixKey = 'LocalFile:';
class CacheLocalFile {
  prefixKey() {
    return `${prefixKey}:*`;
  }
  key(lfReq: FileRefRequest) {
    let locaFileCache = `${prefixKey}:${lfReq.uid}`;
    if (lfReq.thumb) {
      locaFileCache += ':' + lfReq.thumb.name;
    }
    return locaFileCache;
  }
  async get(lfReq: FileRefRequest) {
    const cacheKey = this.key(lfReq);
    const localFileCacheKey = await useRedis().get(cacheKey);
    return localFileCacheKey || null;
  }
  async set(lfReq: FileRefRequest, localFileMeta: FileMeta) {
    const cacheKey = this.key(lfReq);
    await useRedis().set(cacheKey, JSON.stringify(localFileMeta), 'EX', 300);
  }
}

let cacheLocalFile: CacheLocalFile;
export function useCacheLocalFile() {
  if (!cacheLocalFile) {
    cacheLocalFile = new CacheLocalFile();
  }
  return cacheLocalFile;
}

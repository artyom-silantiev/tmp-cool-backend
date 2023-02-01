import { LocalFilesRequest } from '@share/modules/local_files/local_files_request';
import { LocalFileMeta } from '@share/modules/local_files/local_files-output.service';
import { useRedis } from '../redis';

const prefixKey = 'LocalFile:';
class CacheLocalFile {
  prefixKey() {
    return `${prefixKey}:*`;
  }
  key(lfReq: LocalFilesRequest) {
    let locaFileCache = `${prefixKey}:`;
    locaFileCache = lfReq.sha256;
    if (lfReq.thumb) {
      locaFileCache += ':' + lfReq.thumb.name;
    }
    return locaFileCache;
  }
  async get(lfReq: LocalFilesRequest) {
    const cacheKey = this.key(lfReq);
    const localFileCacheKey = await useRedis().get(cacheKey);
    return localFileCacheKey || null;
  }
  async set(lfReq: LocalFilesRequest, localFileMeta: LocalFileMeta) {
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

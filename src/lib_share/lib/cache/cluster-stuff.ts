import { ClusterAppType } from '@share/lib/env/env';
import { useRedis } from '../redis';

const prefixKey = 'CApp';

class ClusterStuff {
  getAppChanName(appUid: string) {
    return `${appUid}@app`;
  }
  getPrefixKey() {
    return prefixKey;
  }
  key(appType: ClusterAppType, appUid: string) {
    return `${prefixKey}:${appType}:${appUid}`;
  }
  async del(appType: ClusterAppType, appUid: string) {
    const cacheKey = this.key(appType, appUid);
    await useRedis().del(cacheKey);
  }
}

let clusterStuff: ClusterStuff;
export function useClusterStuff() {
  if (!clusterStuff) {
    clusterStuff = new ClusterStuff();
  }
  return clusterStuff;
}

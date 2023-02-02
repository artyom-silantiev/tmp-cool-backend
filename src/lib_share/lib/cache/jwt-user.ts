import { UserRole } from '@prisma/client';
import { useRedis } from '../redis';

const prefixKey = 'userJwc';

class CacheJwtUser {
  key(userId: string) {
    return `${prefixKey}:${userId}`;
  }
  async get(userId: string) {
    const cacheKey = this.key(userId);
    const userJwtCache = await useRedis().get(cacheKey);
    return userJwtCache || null;
  }
  async set(
    userId: string,
    jwtUser: {
      userId: string;
      role: UserRole;
    },
  ) {
    const cacheKey = this.key(userId);
    await useRedis().set(cacheKey, JSON.stringify(jwtUser), 'EX', 3600);
  }
}

let cacheJwtUser: CacheJwtUser;
export function useCacheJwtUser() {
  if (!cacheJwtUser) {
    cacheJwtUser = new CacheJwtUser();
  }
  return cacheJwtUser;
}

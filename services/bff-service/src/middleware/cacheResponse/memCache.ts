type Result<T> = [boolean, T];
const Ok = <T>(value: T): Result<T> => [true, value];
const Fail = <E>(err: E): Result<E> => [false, err];

type Cacheable = any;

export type CacheData = {
  value: Cacheable;
  expireAt?: number;
};

export class MemCache {
  constructor(
    private readonly DOES_NOT_EXIST = undefined,
    private store = new Map<string, CacheData>(),
  ) {}

  get(key: string): Result<Cacheable> {
    this.invalidate();
    if (!this.store.has(key)) {
      return Fail(`Key ${key} does not exists`);
    }
    const { value } = this.store.get(key);
    return Ok(value);
  }

  set(key: string, item: CacheData) {
    this.store.set(key, item);
  }

  delete(key) {
    this.store.delete(key);
  }

  invalidate() {
    const now = this.now();
    for (const key of this.store.keys()) {
      const { expireAt } = this.store.get(key);
      if (expireAt && expireAt < now) {
        this.delete(key);
      }
    }
  }

  now() {
    return +new Date();
  }
}

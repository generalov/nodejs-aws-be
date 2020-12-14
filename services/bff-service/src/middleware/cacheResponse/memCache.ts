type Result<T> = [boolean, T];
const Ok = <T>(value: T): Result<T> => [true, value];
const Fail = <E>(err: E): Result<E> => [false, err];

export type Cacheable = any;
export type CacheOptions = {
  expireAt?: number;
};

type CacheData = {
  value: Cacheable;
  options: CacheOptions;
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

  set(key: string, value: Cacheable, options: CacheOptions = {}) {
    this.store.set(key, { value, options });
  }

  delete(key) {
    this.store.delete(key);
  }

  invalidate() {
    const now = this.now();
    for (const key of this.store.keys()) {
      const { options } = this.store.get(key);
      if (options.expireAt && options.expireAt < now) {
        this.delete(key);
      }
    }
  }

  now() {
    return +new Date();
  }
}

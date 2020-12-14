import { pipeline as _pipeline } from 'stream';
import { promisify } from 'util';
import { OutgoingHttpHeaders } from 'http';
import { NextFunction, Request, Response } from 'express';
import { collectStream } from './collectStream';
import { MemCache } from './memCache';
import * as hijackResponse from 'hijackresponse';

const pipeline = promisify(_pipeline);

type Optional<T> = T | undefined;

export type CacheResponseMiddlewareOptions = {
  cache?: MemCache;
  expire?: number | string;
};

type CachedResponse = {
  statusCode: number;
  headers: OutgoingHttpHeaders;
  body: Buffer;
};

const isCacheableResponse = (res: Response) => {
  return res.statusCode === 200;
};

const createCachedResponse = (body: Buffer, req: Request, res: Response) => {
  const headers = Object.entries(res.getHeaders())
    // TODO: filter some headers
    .filter(([key]) => key)
    .reduce((res, [key, value]) => {
      res[key] = value;
      return res;
    }, {});
  const statusCode = res.statusCode;
  return { statusCode, headers, body };
};

const sendCachedResponse = (
  cachedResponse: CachedResponse,
  req: Request,
  res: Response,
) => {
  const { statusCode, headers, body } = cachedResponse;
  Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
  return res.status(statusCode).send(body);
};

const getCacheKey = (req: Request) => {
  const varyHeaders = getVaryHeaders(req);
  return `${req.method}|${req.url}|${JSON.stringify(varyHeaders)}`;
};

const getVaryHeaders = (req: Request) => {
  const vary = req.header('vary');
  if (!vary) {
    return [];
  }
  const parts = new Set(vary.toLowerCase().split(/\s*,\s*/g));
  return Object.entries(req.headers)
    .filter(([key]) => parts.has(key.toLowerCase()))
    .reduce((res, [key, value]) => {
      res[key] = value;
      return res;
    }, {});
};

const parseExpireTime = (
  expire: Optional<number | string>,
): Optional<number> => {
  switch (typeof expire) {
    case 'number':
      return expire;
    case 'undefined':
      return expire;
    case 'string':
      return parseInt(expire, 10);
    default:
      throw new Error(
        `Expire argument should be a number or string, but ${typeof expire} given`,
      );
  }
};

export const cacheResponseMiddleware = ({
  cache = new MemCache(),
  expire = undefined,
}: CacheResponseMiddlewareOptions = {}) => {
  const expireTime = parseExpireTime(expire);

  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    const cacheKey = getCacheKey(req);
    const [exists, cachedResponse] = cache.get(cacheKey);

    if (exists) {
      console.debug(`[bff-service]: Sending cached response`);
      return sendCachedResponse(cachedResponse, req, res);
    }

    hijackResponse(res, next).then(({ readable, writable }) => {
      const writeToCache = (err, body) => {
        if (err) {
          return;
        }
        if (!isCacheableResponse(res)) {
          return;
        }
        cache.set(cacheKey, createCachedResponse(body, req, res), {
          ...(expireTime && { expireAt: expireTime + cache.now() }),
        });
      };

      return pipeline(readable, collectStream(writeToCache), writable).catch(
        (err) => {
          if (err.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
            next(err);
          }
        },
      );
    });
  };
};

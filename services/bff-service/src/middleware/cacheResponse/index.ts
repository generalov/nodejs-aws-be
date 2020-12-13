import { pipeline as _pipeline } from 'stream';
import { promisify } from 'util';
import { OutgoingHttpHeaders } from 'http';
import { NextFunction, Request, Response } from 'express';
import { collectStream } from './collectStream';
import { MemCache } from './memCache';
import * as hijackResponse from 'hijackresponse';

const pipeline = promisify(_pipeline);

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

export type CacheResponseMiddlewareOptions = {
  cache?: MemCache;
  isCacheable?: (res: Response) => boolean;
  expire?: number | string;
};

export const cacheResponseMiddleware = ({
  cache = new MemCache(),
  isCacheable = isCacheableResponse,
  expire = undefined,
}: CacheResponseMiddlewareOptions = {}) => {
  const expireTime =
    typeof expire === 'string' ? parseInt(expire, 10) : undefined;

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
        if (!isCacheable(res)) {
          return;
        }
        cache.set(cacheKey, {
          value: createCachedResponse(body, req, res),
          ...(expire && { expireAt: expireTime + cache.now() }),
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

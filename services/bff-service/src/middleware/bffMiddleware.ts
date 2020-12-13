import { NextFunction, Request, Response } from 'express';
import * as proxy from 'http-proxy-middleware';

type Optional<T> = T | undefined;

export type BffMiddlewareOptions = {
  rules: { [key: string]: string };
};

export const bffMiddleware = (
  { rules }: BffMiddlewareOptions = { rules: process.env },
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const cannotProcessRequest = () => {
      res.status(502).send('Cannot process request');
    };

    const recipientServiceName: Optional<string> = req.url.split('/')[1];
    if (!recipientServiceName) {
      return cannotProcessRequest();
    }

    const recipientURL: Optional<string> = rules[recipientServiceName];
    if (!recipientURL) {
      return cannotProcessRequest();
    }

    const proxyMiddleware = proxy.createProxyMiddleware({
      target: recipientURL,
      pathRewrite: {
        [`/${recipientServiceName}`]: '',
      },
      changeOrigin: true,
      preserveHeaderKeyCase: true,
      onProxyReq: (proxyReq, req, res) => {
        console.log(
          `[bff-service] Proxying ${req.method} request originally made to '${req.originalUrl}'...`,
        );
      },
    });
    proxyMiddleware(req, res, next);
  };
};

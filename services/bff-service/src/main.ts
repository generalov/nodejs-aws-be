import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Request, Response } from 'express';
import * as dotenv from 'dotenv-flow';
import * as proxy from 'http-proxy-middleware';

dotenv.config();

const bffMiddleware = () => {
  return (req: Request, res: Response, next: () => void) => {
    const recipientServiceName = req.url.split('/')[1];
    const recipientURL: string | undefined = process.env[recipientServiceName];
    if (!recipientURL) {
      res.status(502).send('Cannot process request');
    } else {
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
    }
  };
};

async function bootstrap() {
  const { PORT } = process.env;
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.use(bffMiddleware());

  console.debug(`[bff-service] App listening at http://localhost:${PORT}`);
  await app.listen(PORT);
}

bootstrap();

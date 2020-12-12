import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import * as dotenv from 'dotenv-flow';
import * as proxy from 'http-proxy-middleware';

dotenv.config();

const { BFF_PORT: PORT } = process.env;
const xx = Object.entries(process.env)
  .filter(([key]) => key.startsWith('PROXY_'))
  .reduce((res, [key, value]) => {
    const ms = key.toLowerCase().match(/proxy_(.*)_([^_]+)$/);
    if (!ms) return res;
    const [_, name, spec] = ms;
    if (!res[name]) res[name] = {};
    res[name][spec] = value;
    return res;
  }, {});

const proxyRoutes = Object.entries(xx).map(([_, value]) => value);

const bodyParserMiddleware = ({ route }) => {
  const jsonParseMiddleware = bodyParser.json();
  return (req: any, res: any, next: any) => {
    if (route.find(({ path }) => req.path.startsWith(path))) {
      next();
    } else {
      jsonParseMiddleware(req, res, next);
    }
  };
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.use(bodyParserMiddleware({ route: proxyRoutes }));
  proxyRoutes.forEach(({ path, url }) => {
    app.use(
      proxy.createProxyMiddleware({
        target: url,
        pathRewrite: {
          [path]: '',
        },
        secure: false,
        onProxyReq: (proxyReq, req, res) => {
          console.log(
            `[bff-service] Proxying ${req.method} request originally made to '${req.originalUrl}'...`,
          );
        },
      }),
    );
  });

  console.debug(`[bff-service] App listening at http://localhost:${PORT}`);
  await app.listen(PORT);
}

bootstrap();

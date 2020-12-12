import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as https from 'https';
import * as dotenv from 'dotenv-flow';
import * as proxy from 'http-proxy-middleware';

dotenv.config();

const { BFF_PORT: PORT } = process.env;

const routesFromEnv = ({ prefix = 'PROXY', env = process.env } = {}) => {
  const re = new RegExp(`^${prefix.toLowerCase()}_(.*)_([^_]+)$`);
  const routeGroups = Object.entries(env)
    .filter(([key]) => key.startsWith(prefix))
    .reduce((res, [key, value]) => {
      const ms = key.toLowerCase().match(re);
      if (!ms) return res;
      const [, name, spec] = ms;
      (res[name] || (res[name] = {}))[spec] = value;
      return res;
    }, {});
  return Object.values(routeGroups);
};

const proxyMiddleware = ({ path, url }) => {
  const options: proxy.Options = {
    target: url,
    pathRewrite: {
      [path]: '',
    },
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
      console.log(
        `[bff-service] Proxying ${req.method} request originally made to '${req.originalUrl}'...`,
      );
    },
  };
  return proxy.createProxyMiddleware(options);
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const proxyRoutes = routesFromEnv();
  proxyRoutes.forEach(({ path, url }) => {
    app.use(proxyMiddleware({ path, url }));
  });

  console.debug(`[bff-service] App listening at http://localhost:${PORT}`);
  await app.listen(PORT);
}

bootstrap();

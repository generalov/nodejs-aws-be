import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { bffMiddleware } from './middleware/bffMiddleware';
import { cacheResponseMiddleware } from './middleware/cacheResponse';
import * as dotenv from 'dotenv-flow';

dotenv.config();

async function bootstrap() {
  const { PORT = 8080 } = process.env;
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.use(cacheResponseMiddleware({ expire: 2 * 60 * 1000 }));
  app.use(bffMiddleware({ rules: process.env }));

  console.debug(`[bff-service] App listening on http://localhost:${PORT}`);
  await app.listen(PORT);
}

bootstrap();

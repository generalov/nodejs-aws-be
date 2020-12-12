import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv-flow';

dotenv.config();

const { BFF_PORT: PORT } = process.env;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  console.debug(`bff-service app listening at http://localhost:${PORT}`);
  await app.listen(PORT);
}

bootstrap();

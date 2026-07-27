import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filter';
import { TransformInterceptor } from './common/interceptors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug'],
  });
  const expressApp = app.getHttpAdapter().getInstance() as import('express').Express;
  // 本地 mock OSS 文件下载：避免 NestJS 10 + path-to-regexp 6 的通配语法坑，
  // 直接用 Express 原生中间件挂在 /api/v1/upload/mock-file/* 上。
  expressApp.get(/^\/api\/v1\/upload\/mock-file\/(.+)$/, async (req, res) => {
    const fs = await import('fs/promises');
    const path = await import('path');
    const m = req.path.match(/^\/api\/v1\/upload\/mock-file\/(.+)$/);
    const key = m ? m[1] : '';
    if (!key) {
      res.status(400).send('missing key');
      return;
    }
    const localPath = path.join(process.cwd(), 'uploads', key);
    try {
      const buf = await fs.readFile(localPath);
      const ext = path.extname(localPath).toLowerCase();
      const mime =
        ext === '.png'
          ? 'image/png'
          : ext === '.webp'
          ? 'image/webp'
          : 'image/jpeg';
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.send(buf);
    } catch {
      res.status(404).send('Not Found');
    }
  });

  const config = app.get(ConfigService);

  app.use(helmet());
  app.enableCors({
    origin: (config.get<string>('CORS_ORIGIN') ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    credentials: true,
  });
  app.setGlobalPrefix('');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const swaggerCfg = new DocumentBuilder()
    .setTitle('Friends Backend API')
    .setDescription('牵线交友平台后端接口')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const swaggerDoc = SwaggerModule.createDocument(app, swaggerCfg);
  SwaggerModule.setup('api/v1/docs', app, swaggerDoc);

  const port = parseInt(config.get<string>('PORT') ?? '3000', 10);
  await app.listen(port);
  new Logger('Bootstrap').log(`🚀 Friends backend listening on :${port}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal bootstrap error', err);
  process.exit(1);
});
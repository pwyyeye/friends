import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { GlobalExceptionFilter } from "./common/filter";
import { TransformInterceptor } from "./common/interceptors";
import { validationMessages } from "./common/validation";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["log", "error", "warn", "debug"],
  });
  const config = app.get(ConfigService);

  app.use(helmet());
  app.enableCors({
    origin: (config.get<string>("CORS_ORIGIN") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    credentials: true,
  });
  app.setGlobalPrefix("");
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
      exceptionFactory: errors => new BadRequestException(validationMessages(errors)),
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const swaggerCfg = new DocumentBuilder()
    .setTitle("Friends Backend API")
    .setDescription("父母帮助成年子女相亲平台后端接口")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const swaggerDoc = SwaggerModule.createDocument(app, swaggerCfg);
  SwaggerModule.setup("api/v1/docs", app, swaggerDoc);

  const port = parseInt(config.get<string>("PORT") ?? "3000", 10);
  await app.listen(port);
  new Logger("Bootstrap").log(`🚀 Friends backend listening on :${port}`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Fatal bootstrap error", err);
  process.exit(1);
});

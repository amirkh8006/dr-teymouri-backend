import { NestFactory } from '@nestjs/core';
import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  const config = new DocumentBuilder().setTitle('Dr Teymouri API').setDescription('Backend starter API').setVersion('1.0').build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory, {
    swaggerOptions: {
      supportedSubmitMethods: [],
    },
  });

  app.getHttpAdapter().getInstance().disable('x-powered-by');
  app.useGlobalInterceptors(new ResponseInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (data: any) => {
        return new BadRequestException('اطلاعات نامعتبر است', 'VALIDATION ' + JSON.stringify(data[0].constraints));
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
  logger.log(`Application is running on port: ${process.env.PORT ?? 3000}`);
}

bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpErrorFilter } from './common/filter/http-error.filter';
import { ResponseInterceptor } from './common/interceptor/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 使用全局异常过滤器
  app.useGlobalFilters(new HttpErrorFilter());

  app.useGlobalInterceptors(new ResponseInterceptor());

  // 启用 CORS
  app.enableCors({
    origin: '*', // 允许的域名
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS', // 允许的 HTTP 方法
    credentials: true, // 允许发送凭证（cookies）
    allowedHeaders: 'Content-Type, Accept, Authorization', // 允许的请求头
    exposedHeaders: 'Authorization', // 暴露的响应头
    maxAge: 86400, // 预检请求的缓存时间（秒）
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();

import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MetricsModule } from './metrics.module';
import { ConfigModule } from '@nestjs/config';
import { MetricsMiddleware } from './metrics.middleware';
import {HealthController} from "./health.controller";
import {ReadinessService} from "./readiness.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MetricsModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      // В кластере чарт отдаёт дискретные DB_* через ConfigMap/Secret;
      // DATABASE_URL остаётся для локального запуска и имеет приоритет.
      url: process.env.DATABASE_URL,
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: false,
    }),
  ],
  controllers: [AppController, HealthController],
  providers: [AppService, ReadinessService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(MetricsMiddleware)
      .exclude('metrics') // не измеряем сам /metrics эндпоинт
      .forRoutes('*');
  }
}

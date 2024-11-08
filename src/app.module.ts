import { LoggerModule } from 'nestjs-pino';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { ApplicationModule } from './application/application.module';
import { CustomLogger } from './custom.logger';
import { NotificationsModule } from './domain/notifications/notifications.module';
import { SharedModule } from './domain/shared/shared.module';
import { SkillsModule } from './domain/skills/skills.module';
import { UsersModule } from './domain/users/users.module';

@Module({
  imports: [
    ApplicationModule,

    // Domain modules
    SharedModule,
    NotificationsModule,
    SkillsModule,
    UsersModule,

    // Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // TypeORM configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: configService.get<string>('NODE_ENV') === 'development',
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),

    // Background processing
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        },
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: 100,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
      }),
      inject: [ConfigService],
    }),

    // Other general modules
    CqrsModule.forRoot(),
    LoggerModule.forRoot({ pinoHttp: { level: 'trace' } }),
  ],
  providers: [CustomLogger],
  exports: [CustomLogger],
  controllers: [AppController],
})
export class AppModule {}

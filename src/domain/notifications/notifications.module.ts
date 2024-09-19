import { NotifierModule } from 'src/integrations/notifier/notifier.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { Notification } from './entities/notification.entity';
import { NotificationsRepository } from './notifications.repository';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    UsersModule,
    NotifierModule,
    TypeOrmModule.forFeature([Notification]),
  ],
  providers: [NotificationsRepository, NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}

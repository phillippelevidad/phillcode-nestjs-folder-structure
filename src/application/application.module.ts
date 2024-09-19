import { NotificationsModule } from 'src/domain/notifications/notifications.module';
import { UsersModule } from 'src/domain/users/users.module';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { EventHandlers } from './event-handlers';

@Module({
  imports: [
    // Domain modules
    NotificationsModule,
    UsersModule,

    // Queues
    BullModule.registerQueue({ name: 'employee-added' }),
  ],
  providers: [...EventHandlers],
})
export class ApplicationModule {}

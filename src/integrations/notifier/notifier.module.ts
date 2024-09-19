import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { EmailService } from './implementations/email.service';
import { SmsService } from './implementations/sms.service';
import { NotifierService } from './notifier.service';

@Module({
  imports: [BullModule.registerQueue({ name: 'notifications' })],
  providers: [EmailService, NotifierService, SmsService],
  exports: [NotifierService],
})
export class NotifierModule {}

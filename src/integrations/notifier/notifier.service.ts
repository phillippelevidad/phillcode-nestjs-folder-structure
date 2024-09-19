import { Job, Queue } from 'bull';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { SendNotificationDto } from './dto/send-notification.dto';
import { EmailService } from './implementations/email.service';
import { SmsService } from './implementations/sms.service';

@Processor('notifications')
export class NotifierService {
  constructor(
    private readonly email: EmailService,
    private readonly sms: SmsService,
    @InjectQueue('notifications') private readonly queue: Queue,
  ) {}

  async send(dto: SendNotificationDto): Promise<void> {
    if (dto.email) {
      await this.queue.add('send-email', dto);
    }
    if (dto.phone) {
      await this.queue.add('send-sms', dto);
    }
  }

  @Process('send-email')
  protected async sendEmail(job: Job<SendNotificationDto>): Promise<void> {
    const { email, title, shortMessage, longMessage } = job.data;
    await this.email.send(email, title, longMessage || shortMessage);
  }

  @Process('send-sms')
  protected async sendSms(job: Job<SendNotificationDto>): Promise<void> {
    const { phone: phoneNumber, shortMessage, longMessage } = job.data;
    await this.sms.send(
      phoneNumber,
      shortMessage || longMessage.substring(0, 160),
    );
  }
}

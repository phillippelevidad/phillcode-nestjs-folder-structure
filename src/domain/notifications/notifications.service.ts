import { SendNotificationDto } from 'src/integrations/notifier/dto/send-notification.dto';
import { NotifierService as NotificationsSender } from 'src/integrations/notifier/notifier.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Notification } from './entities/notification.entity';
import { NotificationsRepository } from './notifications.repository';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly repository: NotificationsRepository,
    private readonly sender: NotificationsSender,
    private readonly users: UsersService,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const user = await this.users.findOne({ id: dto.userId });
    if (!user) {
      throw new BadRequestException(`Invalid user ID ${dto.userId}`);
    }

    const notification = await this.repository.save(
      this.repository.create(dto),
    );

    await this.sender.send(
      new SendNotificationDto(
        dto.title,
        dto.longMessage,
        dto.shortMessage,
        user.email,
        user.phone,
      ),
    );

    return notification;
  }
}

import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../shared/base-repository';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsRepository extends BaseRepository<Notification> {
  constructor(dataSource: DataSource) {
    super(Notification, dataSource);
  }
}

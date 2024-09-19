import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../shared/base-repository';
import { User } from './entities/user.entity';

@Injectable()
export class UsersRepository extends BaseRepository<User> {
  constructor(dataSource: DataSource) {
    super(User, dataSource);
  }
}

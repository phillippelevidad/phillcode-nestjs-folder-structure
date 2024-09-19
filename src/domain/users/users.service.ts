import { BadRequestException, Injectable } from '@nestjs/common';
import { Filter } from '../shared/apply-filters';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { EmployeeAddedEvent } from './events/employee-added.event';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  async exists(filter: Filter): Promise<boolean> {
    return await this.repository.filterExists(filter);
  }

  async findOne(filter?: Filter): Promise<User> {
    return await this.repository.filterOne(filter);
  }

  async findAll(filter?: Filter): Promise<User[]> {
    return await this.repository.filterAll(filter);
  }

  async create(dto: CreateUserDto): Promise<User> {
    const emailExists = await this.exists({ email: dto.email });
    if (emailExists) {
      throw new BadRequestException(`Email ${dto.email} already in use`);
    }
    const user = this.repository.create(dto);
    if (dto.managerId) {
      const manager = await this.findOne({ id: dto.managerId });
      if (!manager) {
        throw new BadRequestException(`Manager not ${dto.managerId} found`);
      }
      user.domainEvents.push(new EmployeeAddedEvent(manager.id, user.id));
    }
    return await this.repository.save(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne({ id });
    if (!user) return;
    if (dto.email && dto.email !== user.email) {
      const emailExists = await this.exists({ email: dto.email });
      if (emailExists) {
        throw new BadRequestException(`Email ${dto.email} already in use`);
      }
    }
    if (dto.managerId && dto.managerId !== user.managerId) {
      const manager = await this.findOne({ id: dto.managerId });
      if (!manager) {
        throw new BadRequestException(`Manager not ${dto.managerId} found`);
      }
      user.domainEvents.push(new EmployeeAddedEvent(manager.id, user.id));
    }
    Object.assign(user, dto);
    return await this.repository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne({ id });
    if (!user) return;
    await this.repository.remove(user);
  }
}

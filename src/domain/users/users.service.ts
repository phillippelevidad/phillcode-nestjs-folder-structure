import { BadRequestException, Injectable } from '@nestjs/common';
import { Filter } from '../shared/apply-filters';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserSkill } from './entities/user-skill.entity';
import { User } from './entities/user.entity';
import { EmployeeAddedEvent } from './events/employee-added.event';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  async exists(filter: Filter): Promise<boolean> {
    return await this.repository.filterExists(filter);
  }

  async findOne(filter: Filter): Promise<User | null> {
    return await this.repository.filterOne(filter);
  }

  async findAll(filter?: Filter): Promise<User[]> {
    return await this.repository.filterAll(filter);
  }

  async create(dto: CreateUserDto): Promise<User> {
    // Email exists?
    const emailExists = await this.exists({ email: dto.email });
    if (emailExists) {
      throw new BadRequestException(`Email ${dto.email} already in use`);
    }

    // Create a new user entity
    const user = this.repository.create(dto);

    // Handle optional managerId logic
    if (dto.managerId) {
      const manager = await this.findOne({ id: dto.managerId });
      if (!manager) {
        throw new BadRequestException(`Manager not ${dto.managerId} found`);
      }
      user.domainEvents.push(new EmployeeAddedEvent(manager.id, user.id));
    }

    // Handle skills (if any are provided)
    if (dto.skills && dto.skills.length > 0) {
      user.skills = dto.skills.map((skillDto) =>
        this.repository.manager.create(UserSkill, skillDto),
      );
    }

    return await this.repository.save(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne({ id });
    if (!user) return;

    // New email in use?
    if (dto.email && dto.email !== user.email) {
      const emailExists = await this.exists({ email: dto.email });
      if (emailExists) {
        throw new BadRequestException(`Email ${dto.email} already in use`);
      }
    }

    // Handle optional managerId logic
    if (dto.managerId && dto.managerId !== user.managerId) {
      const manager = await this.findOne({ id: dto.managerId });
      if (!manager) {
        throw new BadRequestException(`Manager not ${dto.managerId} found`);
      }
      user.domainEvents.push(new EmployeeAddedEvent(manager.id, user.id));
    }

    // Deconstruct properties that we need to handle separately
    const { skills: skillDtos, ...rest } = dto;

    // Update skills if provided
    if (skillDtos) {
      // Remove skills missing from the DTO
      // user.skills = (user.skills ?? []).filter((s) =>
      //   skillDtos.some((skillDto) => skillDto.skillId === s.skillId),
      // );
      user.skills = skillDtos.map((skillDto) => {
        const existing = user.skills.find(
          (s) => s.skillId === skillDto.skillId,
        );
        return this.repository.manager.create(UserSkill, {
          ...skillDto,
          id: existing?.id,
          userId: user.id,
        });
      });
    }

    Object.assign(user, rest);
    return await this.repository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne({ id });
    if (!user) return;
    await this.repository.remove(user);
  }
}

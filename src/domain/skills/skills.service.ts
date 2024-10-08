import { BadRequestException, Injectable } from '@nestjs/common';
import { Filter } from '../shared/apply-filters';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { Skill } from './entities/skill.entity';
import { SkillsRepository } from './skills.repository';

@Injectable()
export class SkillsService {
  constructor(private readonly repository: SkillsRepository) {}

  async exists(filter: Filter): Promise<boolean> {
    return await this.repository.filterExists(filter);
  }

  async findOne(filter: Filter): Promise<Skill | null> {
    return await this.repository.filterOne(filter);
  }

  async findAll(filter?: Filter): Promise<Skill[]> {
    return await this.repository.filterAll(filter);
  }

  async create(dto: CreateSkillDto): Promise<Skill> {
    const nameExists = await this.exists({ name: dto.name });
    if (nameExists) {
      throw new BadRequestException(`Skill ${dto.name} already exists`);
    }
    const skill = this.repository.create(dto);
    return await this.repository.save(skill);
  }

  async update(id: string, dto: UpdateSkillDto): Promise<Skill> {
    const skill = await this.findOne({ id });
    if (!skill) return;
    if (dto.name && dto.name !== skill.name) {
      const nameExists = await this.exists({ name: dto.name });
      if (nameExists) {
        throw new BadRequestException(`Skill ${dto.name} already exists`);
      }
    }
    Object.assign(skill, dto);
    return await this.repository.save(skill);
  }

  async remove(id: string): Promise<void> {
    const skill = await this.findOne({ id });
    if (!skill) return;
    await this.repository.remove(skill);
  }
}

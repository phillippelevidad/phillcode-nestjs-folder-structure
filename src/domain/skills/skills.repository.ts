import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../shared/base-repository';
import { Skill } from './entities/skill.entity';

@Injectable()
export class SkillsRepository extends BaseRepository<Skill> {
  constructor(dataSource: DataSource) {
    super(Skill, dataSource);
  }
}

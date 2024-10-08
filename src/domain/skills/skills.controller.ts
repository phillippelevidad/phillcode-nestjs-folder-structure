import { plainToClass } from 'class-transformer';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Filter } from '../shared/apply-filters';
import { CreateSkillDto } from './dto/create-skill.dto';
import { SkillDto } from './dto/skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { SkillsService } from './skills.service';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skills: SkillsService) {}

  @Get()
  async findAll(@Query('filter') filter?: Filter) {
    return this.skills
      .findAll(filter)
      .then((skills) => skills.map((skill) => plainToClass(SkillDto, skill)));
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const skill = await this.skills.findOne({ id });
    if (!skill) throw new NotFoundException();
    return plainToClass(SkillDto, skill);
  }

  @Post()
  @HttpCode(201)
  async create(@Body() dto: CreateSkillDto) {
    const skill = await this.skills.create(dto);
    return plainToClass(SkillDto, skill);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSkillDto) {
    const skill = await this.skills.update(id, dto);
    if (!skill) throw new NotFoundException();
    return plainToClass(SkillDto, skill);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    return this.skills.remove(id);
  }
}

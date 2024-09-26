import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { UpdateUserSkillDto } from './update-user-skill.dto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['skills'] as const),
) {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateUserSkillDto)
  skills?: UpdateUserSkillDto[];
}

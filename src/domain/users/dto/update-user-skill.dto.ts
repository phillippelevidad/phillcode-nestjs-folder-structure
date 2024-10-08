import { IsNotEmpty, IsString } from 'class-validator';
import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateUserSkillDto } from './create-user-skill.dto';

export class UpdateUserSkillDto extends PartialType(
  OmitType(CreateUserSkillDto, ['skillId'] as const),
) {
  @IsString()
  @IsNotEmpty()
  skillId: string;
}

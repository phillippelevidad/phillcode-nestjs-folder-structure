import { Exclude, Expose, Type } from 'class-transformer';
import { AggregateRootDto } from 'src/domain/shared/aggregate-root.dto';
import { UserSkillDto } from './user-skill.dto';

@Exclude()
export class UserDto extends AggregateRootDto {
  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  email: string;

  @Expose()
  phone: string;

  @Expose()
  managerId?: string;

  @Expose()
  @Type(() => UserSkillDto)
  skills: UserSkillDto[];
}

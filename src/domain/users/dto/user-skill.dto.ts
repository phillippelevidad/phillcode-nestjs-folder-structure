import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserSkillDto {
  @Expose()
  skillId: string;

  @Expose()
  score?: string;
}

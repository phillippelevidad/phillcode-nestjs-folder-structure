import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CreateUserSkillDto {
  @IsString()
  @IsNotEmpty()
  skillId: string;

  @IsInt()
  @Min(1)
  @Max(10)
  score: number;
}

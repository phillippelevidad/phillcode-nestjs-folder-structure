import { Exclude, Expose } from 'class-transformer';
import { AggregateRootDto } from 'src/domain/shared/aggregate-root.dto';

@Exclude()
export class SkillDto extends AggregateRootDto {
  @Expose()
  name: string;
}

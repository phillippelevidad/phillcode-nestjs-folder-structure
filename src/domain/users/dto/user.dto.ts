import { Exclude, Expose } from 'class-transformer';
import { AggregateRootDto } from 'src/domain/shared/aggregate-root.dto';

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
}

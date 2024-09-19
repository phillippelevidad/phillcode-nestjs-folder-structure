import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class BaseEntityDto {
  @Expose()
  id: string;
}

import { generateId } from 'src/utils/generate-id';
import {
  BaseEntity as TypeOrmBaseEntity,
  BeforeInsert,
  PrimaryColumn,
} from 'typeorm';

export abstract class BaseEntity extends TypeOrmBaseEntity {
  @PrimaryColumn('bigint')
  id: string;

  @BeforeInsert()
  generateId() {
    this.id = generateId();
  }
}

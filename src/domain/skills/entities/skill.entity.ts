import { AggregateRoot } from 'src/domain/shared/aggregate-root';
import { Column, Entity } from 'typeorm';

@Entity('skills')
export class Skill extends AggregateRoot {
  @Column({ unique: true })
  name: string;
}

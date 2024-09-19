import { AggregateRoot } from 'src/domain/shared/aggregate-root';
import { User } from 'src/domain/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('notifications')
export class Notification extends AggregateRoot {
  @Column()
  @JoinColumn({ name: 'userId' })
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  userId: string;

  @Column()
  title: string;

  @Column()
  longMessage: string;

  @Column()
  shortMessage: string;
}

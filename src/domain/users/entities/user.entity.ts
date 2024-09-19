import { AggregateRoot } from 'src/domain/shared/aggregate-root';
import { hashPassword } from 'src/utils/hash-password';
import { BeforeInsert, Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity('users')
export class User extends AggregateRoot {
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  phone: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  @JoinColumn({ name: 'managerId' })
  @ManyToOne(() => User, null, { onDelete: 'SET NULL' })
  managerId?: string;

  @BeforeInsert()
  async hashPassword() {
    this.password = await hashPassword(this.password);
  }
}

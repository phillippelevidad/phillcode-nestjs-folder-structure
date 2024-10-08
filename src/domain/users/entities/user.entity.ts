import { AggregateRoot } from 'src/domain/shared/aggregate-root';
import { hashPassword } from 'src/utils/hash-password';
import {
  AfterLoad,
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { UserSkill } from './user-skill.entity';

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

  @OneToMany(() => UserSkill, (skill) => skill.user, {
    cascade: true, // Automatically save, update, and remove user skills
    eager: true, // Automatically load skills when user is loaded
  })
  skills: UserSkill[];

  @BeforeInsert()
  protected async beforeInsert() {
    this.password = await hashPassword(this.password);
  }

  @AfterLoad()
  protected afterLoad() {
    this.skills = this.skills ?? [];
  }
}

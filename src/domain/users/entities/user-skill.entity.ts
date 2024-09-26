import { BaseEntity } from 'src/domain/shared/base-entity';
import { Skill } from 'src/domain/skills/entities/skill.entity';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { User } from './user.entity';

@Entity('user_skills')
@Unique(['user', 'skillId'])
export class UserSkill extends BaseEntity {
  @ManyToOne(() => User, (user) => user.skills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'bigint' })
  @ManyToOne(() => Skill, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'skillId' })
  skillId: string;

  @Column({ type: 'int2' })
  score: number;
}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Student } from '../student/student.entity';

export enum CourseStatus {
  APPROVED = 'approved',
  FAILED = 'failed',
}

export enum SemesterPeriod {
  S1 = 'S1', 
  S2 = 'S2',
  I = 'I',
  V = 'V',
}

@Entity()
export class Progress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Student, { eager: true })
  student: Student;

  @Column()
  courseCode: string;

  @Column({ type: 'enum', enum: CourseStatus })
  status: CourseStatus;

  @Column({ nullable: true })
  grade: number;

  @Column()
  year: number;

  @Column({ type: 'enum', enum: SemesterPeriod })
  period: SemesterPeriod;
}

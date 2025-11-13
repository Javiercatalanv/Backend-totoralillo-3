import { Module } from '@nestjs/common';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { CurriculumModule } from '../curriculum/curriculum.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Progress } from './progress.entity';
import { StudentModule } from 'src/student/student.module';

@Module({
  imports: [
    CurriculumModule, // Necesita el servicio de Curriculum
    TypeOrmModule.forFeature([Progress]),
    StudentModule,], 
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService], // Exporta para Simulación y Optimización
})
export class ProgressModule {}
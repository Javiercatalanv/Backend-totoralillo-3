import {IsArray,IsEnum,IsInt,IsNotEmpty,IsOptional,IsString,Max,Min,ValidateNested,ArrayMinSize,ArrayNotEmpty,IsUUID,} from 'class-validator';
import { Type } from 'class-transformer';

export enum SemesterPeriod {
  S1 = 'S1', // Semestre 1
  S2 = 'S2', // Semestre 2
  I = 'I',   // Invierno
  V = 'V',   // Verano
}

export class SemesterPlan {
  @IsInt()
  @Min(2020)
  year: number;

  @IsEnum(SemesterPeriod, {
    message: 'El periodo debe ser uno de los siguientes: S1, S2, I, V',
  })
  period: SemesterPeriod;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  courses: string[]; // Códigos de los cursos
}

export class CreateManualSimulationDto {
  @IsUUID('4', { message: 'studentId debe ser un UUID válido' })
  studentId: string;

  @IsString()
  @IsNotEmpty()
  careerCode: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SemesterPlan)
  manualPlan: SemesterPlan[];

  @IsInt()
  @Min(20)
  @Max(80)
  maxCreditsPerSemester: number;

  // Opcional: lista de ramos reprobados simulados
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  simulatedFails?: string[];
}

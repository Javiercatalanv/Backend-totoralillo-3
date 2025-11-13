import {IsBoolean,IsInt,IsNotEmpty,IsOptional,IsString,IsUUID,Max,Min} from 'class-validator';

export class OptimizeDto {
  @IsUUID('4', { message: 'studentId debe ser un UUID válido' })
  studentId: string;

  @IsString()
  @IsNotEmpty()
  careerCode: string;

  @IsInt()
  @Min(20)
  @Max(80)
  maxCreditsPerSemester: number;

  @IsInt()
  @Min(1)
  @Max(10)
  maxCoursesPerSemester: number;

  @IsBoolean()
  useSummerWinter: boolean;

  // Opcional: Arreglo de ramos que el alumno quiere repetir en automático
  @IsOptional()
  @IsString({ each: true })
  simulatedFails?: string[];
}

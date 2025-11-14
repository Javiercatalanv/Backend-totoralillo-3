import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateManualSimulationDto, SemesterPlan } from './dto/create-manual-simulation.dto';
import { ProgressService } from '../progress/progress.service';
import { CurriculumService, Course, Curriculum } from '../curriculum/curriculum.service';
import { logger } from '../common/logger/logger';

@Injectable()
export class SimulationService {
  constructor(
    private readonly progressService: ProgressService,
    private readonly curriculumService: CurriculumService,
  ) {logger.info('[SimulationService] Servicio inicializado.');}

  async generateManualProjection(dto: CreateManualSimulationDto) {
    logger.info(`[SimulationService] Generando proyección manual para estudiante ${dto.studentId}, carrera ${dto.careerCode}`);

    const history = await this.progressService.getAcademicHistory(dto.studentId);
    const curriculum = await this.curriculumService.getCurriculum(dto.careerCode);
    
    //simular los cursos aprobados hasta el momento
    const simulatedApproved = new Set(history.approved);
    
    let totalCreditsPerSemester: { semester: string; credits: number }[] = []; // Tarea 3

    logger.debug(`[SimulationService] Plan manual recibido: ${dto.manualPlan.length} semestres`);
    
    //validar el plan manual
    for (const semester of dto.manualPlan) {
      logger.info(`[SimulationService] Validando semestre ${semester.period}-${semester.year} (${semester.courses.length} cursos)`);

      const validationResult = await this.validateSemester(
        semester,
        curriculum,
        simulatedApproved,
        history.failed,
        dto.maxCreditsPerSemester,
      );

      if (!validationResult.isValid) {
        logger.error(`[SimulationService] Error en ${semester.period} ${semester.year}: ${validationResult.error}`);
        throw new BadRequestException(`Error en ${semester.period} ${semester.year}: ${validationResult.error}`);
      }

      
      semester.courses.forEach(code => simulatedApproved.add(code));
      totalCreditsPerSemester.push({
        semester: `${semester.period}-${semester.year}`,
        credits: validationResult.semesterCredits, 
      });
      logger.debug(`[SimulationService] Semestre válido: ${semester.period}-${semester.year} (${validationResult.semesterCredits} créditos)`);
    }

    logger.info(`[SimulationService] Generando proyección automática para ramos restantes...`);

    //calcular el resto de la carrera (la proyeccion)

    const futurePlan = this.calculateRemainingPlan(curriculum, simulatedApproved, dto.maxCreditsPerSemester);

    
    const fullPlan = [...dto.manualPlan, ...futurePlan.plan];
    const estimatedGraduation = fullPlan.length > 0 ? 
      `${fullPlan[fullPlan.length - 1].period} ${fullPlan[fullPlan.length - 1].year}` :
      'Ya egresado';

    logger.info(`[SimulationService] Proyección generada. Fecha estimada de egreso: ${estimatedGraduation}`);

    return {
      estimatedGraduation,
      totalCreditsPerSemester, 
      fullPlan, 
      approvedCourses: Array.from(simulatedApproved),
      pendingCourses: futurePlan.pending,
    };
  }

  //Aplicar restricciones
  private async validateSemester(
    semester: SemesterPlan,
    curriculum: Curriculum,
    approvedSoFar: Set<string>,
    failedSoFar: Set<string>,
    maxCredits: number,
  ): Promise<{ isValid: boolean; error?: string; semesterCredits: number }> {

    logger.debug(`[SimulationService] Validando reglas para semestre ${semester.period}-${semester.year}`);
    
    let semesterCredits = 0;

    for (const courseCode of semester.courses) {
      const course = curriculum.courses.get(courseCode);

      if (!course) {
        logger.warn(`[SimulationService] Ramo no encontrado: ${courseCode}`);
        return { isValid: false, error: `Ramo ${courseCode} no existe.`, semesterCredits: 0 };
      }

      
      for (const preCode of course.prerequisites) {
        if (!approvedSoFar.has(preCode)) {
          logger.warn(`[SimulationService] Prerrequisito faltante ${preCode} para ${courseCode}`);
          return { isValid: false, error: `Falta prerrequisito ${preCode} para ${courseCode}.`, semesterCredits: 0 };
        }
      }
      
      
      if (semester.period === 'I' || semester.period === 'V') {
        if (!failedSoFar.has(courseCode)) {
          return { isValid: false, error: `Ramo ${courseCode} solo se puede tomar en I/V si fue reprobado.`, semesterCredits: 0 };
        }
      }
      
      semesterCredits += course.credits;
    }

   
    if (semesterCredits > maxCredits) {
      return { isValid: false, error: `Excede el máximo de créditos (${semesterCredits} > ${maxCredits}).`, semesterCredits };
    }
    
    return { isValid: true, semesterCredits };
  }

 
  private calculateRemainingPlan(curriculum: Curriculum, approved: Set<string>, maxCredits: number) {
    //Implementar lógica de optimización aqui(pendiente)
    
    console.warn('calculateRemainingPlan no implementado');
    return { plan: [], pending: [] };
  }
}
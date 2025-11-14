import { Injectable, NotFoundException } from '@nestjs/common';
import { CurriculumService } from '../curriculum/curriculum.service';
import { CreateProgressDto } from './dto/create-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { logger } from '../common/logger/logger'

export interface AcademicHistory {
  approved: Set<string>; // Códigos de ramos aprobados
  failed: Set<string>;   // Códigos de ramos reprobados
}

@Injectable()
export class ProgressService {
  
  // TODO: Esto debe estar en la BASE DE DATOS. TERMINAR LA BASE DE DATOS NO OLVIDAR.

  private studentHistoryDB = new Map<string, AcademicHistory>();
  studentService: any;
  progressRepo: any;

  constructor(
    private readonly curriculumService: CurriculumService
  ) {
    logger.info('[ProgressService] Inicializando servicio...');
    this.studentHistoryDB.set('student-123', {
      approved: new Set(['MAT001', 'PRG001']),
      failed: new Set(['FIS001']),
    });
  }

  /**
   * Retrieves the academic history for a given student.
   * @param studentId - The unique identifier of the student
   * @returns A promise that resolves to an AcademicHistory object containing the student's approved and failed courses
   */
  async getAcademicHistory(studentId: string): Promise<AcademicHistory> {
    logger.info(`[ProgressService] Obteniendo historial académico de ${studentId}`);
    return this.studentHistoryDB.get(studentId) || { approved: new Set(), failed: new Set() };
  }

  /**
   * Persist a student's academic history in an in-memory store.
   *
   * Converts the provided arrays of approved and failed course identifiers into Sets
   * (to ensure uniqueness), stores them under the given studentId in the internal
   * studentHistoryDB Map, and returns the stored record.
   *
   * This method is asynchronous (returns a Promise) to mirror typical database I/O,
   * but currently simulates persistence using an in-memory Map.
   *
   * @param studentId - Unique identifier of the student whose history is being set.
   * @param approved - Array of identifiers (e.g., course IDs or codes) representing approved courses; will be stored as a Set<string>.
   * @param failed - Array of identifiers representing failed courses; will be stored as a Set<string>.
   * @returns A Promise resolving to the saved record for the student: an object containing approved and failed as Set<string>. May be undefined if the entry is not present in the store.
   */
  async setAcademicHistory(studentId: string, approved: string[], failed: string[]) {
    // Simula guardar en DB
    logger.info(`[ProgressService] Guardando historial(simulado) para ${studentId}`);
    this.studentHistoryDB.set(studentId, {
      approved: new Set(approved),
      failed: new Set(failed),
    });
    return this.studentHistoryDB.get(studentId);
  }


  /**
   * Retrieves a list of pending courses for a student in a specific career.
   * 
   * @param studentId - The unique identifier of the student
   * @param careerCode - The code of the career/curriculum
   * @returns A promise that resolves to an array of course codes that are pending (not yet approved)
   * 
   * @example
   * const pendingCourses = await this.getPendingCourses('student123', 'CAREER001');
   * // Returns: ['CS101', 'MATH201', 'ENG150']
   */
  async getPendingCourses(studentId: string, careerCode: string): Promise<string[]> {
    logger.info(`[ProgressService] Calculando cursos pendientes de ${studentId} para la carrera ${careerCode}`);
    const history = await this.getAcademicHistory(studentId);
    const curriculum = await this.curriculumService.getCurriculum(careerCode);
    
    const allCourseCodes = Array.from(curriculum.courses.keys());
    
    const pending = allCourseCodes.filter(code => !history.approved.has(code));

    logger.debug(`[ProgressService] Pendientes encontrados para ${studentId}: ${pending.join(', ') || 'ninguno'}`);
    return pending;
  }

  /**
   * Retrieves the progress records for a specific student.
   * @param studentId - The unique identifier of the student whose progress is to be retrieved.
   * @returns A promise that resolves to an array of progress records ordered by year in ascending order.
   * @throws {NotFoundException} If the student with the given ID is not found.
   */
  async getStudentProgress(studentId: string) {
    logger.info(`[ProgressService] Consultando progreso del estudiante ${studentId}`);
    const student = await this.studentService.findById(studentId);
    if (!student) {
      logger.warn(`[ProgressService] Estudiante no encontrado: ${studentId}`);
      throw new NotFoundException('Estudiante no encontrado');
    }

    return this.progressRepo.find({
      where: { student: { id: studentId } },
      order: { year: 'ASC' },
    });
  }

    /**
     * Creates a new progress record for a student.
     * @param studentId - The unique identifier of the student
     * @param dto - The data transfer object containing progress details
     * @returns A promise that resolves to the created progress entity
     * @throws {NotFoundException} When the student with the given ID is not found
     */
  async createProgress(studentId: string, dto: CreateProgressDto) {
    logger.info(`[ProgressService] Creando registro de progreso para ${studentId}`);
    const student = await this.studentService.findById(studentId);
    if (!student) {
     logger.error(`[ProgressService] Error al crear progreso: estudiante ${studentId} no existe`);      
      throw new NotFoundException('Estudiante no encontrado');
    }

    const progress = this.progressRepo.create({
      student,
      ...dto,
    });

    logger.debug(`[ProgressService] Datos para crear progreso: ${JSON.stringify(dto)}`);

    return this.progressRepo.save(progress);
  }

  /**
   * Updates an existing progress record with the provided data.
   * @param id - The unique identifier of the progress record to update
   * @param dto - The data transfer object containing the fields to update
   * @returns A promise that resolves to the updated progress entity
   * @throws {NotFoundException} When the progress record with the given id is not found
   */
  async updateProgress(id: string, dto: UpdateProgressDto) {
    logger.info(`[ProgressService] Actualizando progreso con id ${id}`);
    const exist = await this.progressRepo.findOne({ where: { id } });

    if (!exist) {
      logger.warn(`[ProgressService] Registro no encontrado: ${id}`);
      throw new NotFoundException('Registro no encontrado');
    }

    Object.assign(exist, dto);

    logger.debug(`[ProgressService] Datos actualizados: ${JSON.stringify(dto)}`);

    return this.progressRepo.save(exist);
  }

  /**
   * Retrieves progress records for a specific student using parameterized queries.
   * @param studentId - The unique identifier of the student whose progress records are to be retrieved
   * @returns A promise that resolves to an array of progress records for the specified student
   */
  async getProgressSecure(studentId: string) {
    logger.info(`[ProgressService] Ejecutando consulta segura para estudiante ${studentId}`);
    return this.progressRepo
      .createQueryBuilder('p')
      .where('p.studentId = :id', { id: studentId }) // Query parametrizada
      .getMany();
  }

}
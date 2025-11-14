import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ExternalApiService } from '../external-api/external-api.service';
import { logger } from '../common/logger/logger'

// Estructura interna de un curso 
export interface Course {
  code: string;
  name: string;
  credits: number;
  prerequisites: string[];
}

// Estructura de la malla completa
export interface Curriculum {
  careerCode: string;
  courses: Map<string, Course>; // Use un Map para acceso rapido por codigo
  totalCourses: number;
}

@Injectable()
export class CurriculumService {
  
 
  // para no llamar a la API externa en cada request. (testeo aun no poseo conocimiento claro sobre el funcionamiento)
  private curriculumCache = new Map<string, Curriculum>();

  constructor(private readonly externalApiService: ExternalApiService) {}

  async getCurriculum(careerCode: string): Promise<Curriculum> {
    logger.info(`[curriculum.service] Solicitando malla curricular para: ${careerCode}`); //log que registra la solicitud    
    if (this.curriculumCache.has(careerCode)) {
      logger.info(`[curriculum.service] Malla encontrada en caché: ${careerCode}`);      
      const cachedCurriculum = this.curriculumCache.get(careerCode);
      if (!cachedCurriculum) {
        logger.error(`[curriculum.service] Error: malla en caché vacía para ${careerCode}`);
        throw new InternalServerErrorException('Error procesando la malla curricular');
      }
      return cachedCurriculum;
    }

    try {
      logger.info(`[curriculum.service] Consultando API externa para: ${careerCode}`);
      const apiCourses: Course[] = this.externalApiService.fetchCurriculumFromAPI(careerCode) as unknown as Course[];
      
      const courseMap = new Map<string, Course>();
      apiCourses.forEach(course => {
        courseMap.set(course.code, course);
      });

      const curriculum: Curriculum = {
        careerCode: careerCode,
        courses: courseMap,
        totalCourses: courseMap.size,
      };

      this.curriculumCache.set(careerCode, curriculum);
      logger.debug(`[curriculum.service] Malla de ${careerCode} cargada con ${courseMap.size} cursos`);
      return curriculum;

    } catch (error) {
      logger.error(`[curriculum.service] Error obteniendo malla para ${careerCode}: ${error}`);
      throw new InternalServerErrorException('Error procesando la malla curricular');
    }
  }

  async getCourseDetails(courseCode: string): Promise<Course | undefined> {
    // optimizar esto, deberia buscar por cache
    // modificar para los ramos de las distintas mallas; actualmente funciona para una sola malla.
    logger.debug(`[curriculum.service] Buscando detalles del curso: ${courseCode}`);

    for (const curriculum of this.curriculumCache.values()) {
      if (curriculum.courses.has(courseCode)) {
        logger.info(`[curriculum.service] Curso ${courseCode} encontrado`);
        return curriculum.courses.get(courseCode);
      }
    }
   
    logger.warn(`[curriculum.service] Curso ${courseCode} no encontrado`);    
    return undefined;
  }

  
  async getCourseCredits(courseCode: string): Promise<number> {
    const details = await this.getCourseDetails(courseCode);

    if (details) {
      logger.info(`[curriculum.service] Créditos del curso ${courseCode}: ${details.credits}`);
    } else {
      logger.warn(`[curriculum.service] Curso ${courseCode} sin creditos`);
    }

    return details ? details.credits : 0;
  }
}
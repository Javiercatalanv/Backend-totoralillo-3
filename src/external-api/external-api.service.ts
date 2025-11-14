import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { LoginDto } from './dto/login.dto';
import { logger } from '../common/logger/logger'


interface LoginResponse {
  rut: string;
  carreras: CarreraInfo[];
}
interface CarreraInfo {
  codigo: string;
  nombre: string;
  catalogo: string;
}

@Injectable()
export class ExternalApiService {
  fetchCurriculumFromAPI(careerCode: string) {
    throw new Error('Method not implemented.');
  }
  private readonly logger = new Logger(ExternalApiService.name);

  // URLs base de las APIs externas
  private readonly puclaroApiBaseUrl = 'https://puclaro.ucn.cl/eross/avance';
  private readonly losVilosApiBaseUrl = 'https://losvilos.ucn.cl/hawaii/api';
  
 
  private readonly hawaiiAuthToken = 'jf400fejof13f';

  constructor(private readonly httpService: HttpService) {}


  async getFullStudentData(loginDto: LoginDto) {
    
    logger.info(`[ExternalApiService] Intentando login para: ${loginDto.email}`);
    const loginUrl = `${this.puclaroApiBaseUrl}/login.php?email=${loginDto.email}&password=${loginDto.password}`;
    
    const loginData = await this.fetchApi<LoginResponse>(loginUrl, 'Login');
    
    if (!loginData || !loginData.rut) {
      logger.warn(`[ExternalApiService] Login fallido para: ${loginDto.email}`);
      throw new UnauthorizedException('Email o contraseña inválidos');
    }

    const { rut, carreras } = loginData;
    logger.debug(`[ExternalApiService] Login exitoso. RUT: ${rut}. Carreras: ${carreras.length}`);


    const carrerasConDatos = await Promise.all(
      carreras.map(async (carrera) => {
        logger.info(`[ExternalApiService] Procesando carrera: ${carrera.nombre} (${carrera.codigo})`);        
       
        const malla = await this.fetchMalla(carrera.codigo, carrera.catalogo);
        logger.debug(`[ExternalApiService] Malla obtenida para ${carrera.codigo} (${malla?.length || 0} cursos)`);        
      
        const avance = await this.fetchAvance(rut, carrera.codigo);
        logger.debug(`[ExternalApiService] Avance obtenido para ${rut} (${avance?.length || 0} registros)`);
        
        return {
          ...carrera,
          malla,
          avance,
        };
      }),
    );

   
    return {
      rut,
      carreras: carrerasConDatos,
    };
  }

 
  private async fetchApi<T>(url: string, operation: string, headers: object = {}): Promise<T> {
    logger.info(`[ExternalApiService] Llamando API [${operation}]: ${url}`);
    
    const { data } = await firstValueFrom(
      this.httpService.get<T>(url, { headers }).pipe(
        catchError((error: AxiosError) => {
          logger.error(`[ExternalApiService] Error en [${operation}]: ${error.message}`);          
          throw new NotFoundException(`No se pudieron obtener datos de [${operation}]`);
        }),
      ),
    );
    return data;
  }

  
  private async fetchMalla(codigoCarrera: string, catalogo: string) {
    const url = `${this.losVilosApiBaseUrl}/mallas?${codigoCarrera}-${catalogo}`;
    const headers = { 'X-HAWAII-AUTH': this.hawaiiAuthToken };
    
    logger.info(`[ExternalApiService] Solicitando malla para ${codigoCarrera}-${catalogo}`);    
    return this.fetchApi<any[]>(url, 'Malla', headers);
  }

 
  private async fetchAvance(rut: string, codigoCarrera: string) {
    const url = `${this.puclaroApiBaseUrl}/avance.php?rut=${rut}&codcarrera=${codigoCarrera}`;
    logger.debug(`[ExternalApiService] Solicitando avance académico para RUT ${rut}, carrera ${codigoCarrera}`); 
    return this.fetchApi<any[]>(url, 'Avance');
  }
}
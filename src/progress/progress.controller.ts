import {Controller,Get,Post,Body,Param,UseGuards,Req,Patch} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

import { ProgressService } from './progress.service';
import { CreateProgressDto } from './dto/create-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Controller('progress')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  //obtener su propio progreso ALUMNO
  @Get('me')
  @Roles('student')
  async myProgress(@Req() req) {
    return this.progressService.getStudentProgress(req.user.id);
  }

  //ver progreso de cualquier alumno ADMIN
  @Get('student/:id')
  @Roles('admin')
  async getProgressForStudent(@Param('id') id: string) {
    return this.progressService.getStudentProgress(id);
  }

  //agregar progreso a un alumno ADMIN
  @Post('student/:id')
  @Roles('admin')
  async addProgress(
    @Param('id') studentId: string,
    @Body() dto: CreateProgressDto,
  ) {
    return this.progressService.createProgress(studentId, dto);
  }

  //editar progreso ADMIN
  @Patch(':progressId')
  @Roles('admin')
  async updateProgress(
    @Param('progressId') id: string,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.progressService.updateProgress(id, dto);
  }
}

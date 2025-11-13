import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { StudentService } from '../student/student.service';
import * as bcrypt from 'bcrypt';
import { AdminService } from '../admin/admin.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

@Controller('auth')
/**
 * AuthController
 *
 * Controller that exposes authentication and registration endpoints.
 *
 * Responsibilities:
 * - Authenticate users and issue JWTs.
 * - Register new student accounts.
 * - Register new admin accounts (protected by JWT + role checks).
 *
 * Routes:
 * - POST 'login'        : Validates credentials and returns an authentication token via AuthService.login.
 * - POST 'register'     : Creates a new student after hashing the provided password (bcrypt, salt rounds = 10).
 * - POST 'register-admin': Creates a new admin after hashing the provided password (bcrypt, salt rounds = 10).
 *                         This endpoint is protected by AuthGuard('jwt') and RolesGuard and requires the 'admin' role.
 *
 * Constructor dependencies:
 * @param authService   AuthService used to validate users and create JWTs.
 * @param studentService StudentService used to create student records.
 * @param adminService  AdminService used to create admin records.
 *
 * Notes:
 * - Password hashing is performed with bcrypt within controller methods; consider delegating hashing to services for separation of concerns.
 * - Ensure DTO validation and centralized error handling are in place to avoid leaking sensitive information.
 * - The register-admin endpoint relies on a RolesGuard and role metadata; ensure these mechanisms are implemented and tested.
 *
 * @public
 */
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly studentService: StudentService,
    private readonly adminService: AdminService,
  ) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const hash = await bcrypt.hash(dto.password, 10);

    const student = await this.studentService.create({
      email: dto.email,
      name: dto.name,
      careerCode: dto.careerCode,
      passwordHash: hash,
    });

    return { message: 'Estudiante creado', student };
  }

  @Post('register-admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async registerAdmin(@Body() dto: RegisterDto) {
    const hash = await bcrypt.hash(dto.password, 10);

    const admin = this.adminService.create({
        email: dto.email,
        name: dto.name,
        passwordHash: hash,
        role: ''
    });

    return { message: 'Admin creado', admin };
  }
}

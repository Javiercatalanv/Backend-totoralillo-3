import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { StudentService } from '../student/student.service';
import { AdminService } from '../admin/admin.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly studentService: StudentService,
    private readonly adminService: AdminService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    // 1. Buscar como estudiante
    let user: any = await this.studentService.findByEmail(email);
    let role = 'student';

    // 2. Si no está, buscar como admin
    if (!user) {
      user = await this.adminService.findByEmail(email);
      role = 'admin';
    }

    if (!user) throw new UnauthorizedException('Credenciales incorrectas');

    const passOK = await bcrypt.compare(password, user.passwordHash);
    if (!passOK) throw new UnauthorizedException('Credenciales incorrectas');

    const { passwordHash, ...cleanUser } = user;

    return { ...cleanUser, role };
  }

  async login(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}

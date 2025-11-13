import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Admin } from './admin.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class AdminService {
  private admins: Admin[] = [];

  constructor() {
    const superAdmin: Admin = {
      id: randomUUID(),
      email: 'admin@totoralillo.cl',
      name: 'SuperAdmin',
      passwordHash: bcrypt.hashSync('admin1234', 10),
      role: 'admin',
    };

    this.admins.push(superAdmin);
  }

  findByEmail(email: string) {
    return this.admins.find(a => a.email === email);
  }

  create(data: Omit<Admin, 'id'>) {
    const admin: Admin = {
      id: randomUUID(),
      ...data,
    };
    this.admins.push(admin);
    return admin;
  }
}

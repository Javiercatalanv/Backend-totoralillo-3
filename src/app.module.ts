import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { StudentModule } from './student/student.module';
import { CurriculumModule } from './curriculum/curriculum.module';
import { SimulationModule } from './simulation/simulation.module';
import { OptimizationModule } from './optimization/optimization.module';
import { ProgressModule } from './progress/progress.module';
import { ExternalApiModule } from './external-api/external-api.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),
    AdminModule,
    AuthModule,
    StudentModule,
    CurriculumModule,
    SimulationModule,
    OptimizationModule,
    ProgressModule,
    ExternalApiModule,
    AnalyticsModule,
  ],
})
export class AppModule {}

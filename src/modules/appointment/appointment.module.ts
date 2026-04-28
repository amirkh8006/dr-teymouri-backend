import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Appointment, AppointmentSchema } from './schemas/appointment.schema';
import { DoctorAvailability, DoctorAvailabilitySchema } from './schemas/doctor-availability.schema';
import { AppointmentService } from './services/appointment.service';
import { AppointmentController } from './controllers/appointment.controller';
import { AdminAppointmentController } from './controllers/admin-appointment.controller';
import { PersianCalendarService } from './utils/persian-calendar.service';
import { User, UserSchema } from '../user/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Appointment.name, schema: AppointmentSchema },
      { name: DoctorAvailability.name, schema: DoctorAvailabilitySchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService, PersianCalendarService],
  exports: [AppointmentService, PersianCalendarService],
})
export class AppointmentModule {}

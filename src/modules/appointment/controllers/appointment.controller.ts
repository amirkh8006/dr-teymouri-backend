import { Controller, Post, Get, Put, Param, Body, UseGuards, Request, Query, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { AppointmentService } from '../services/appointment.service';
import { CreateAppointmentDto, UpdateAppointmentStatusDto, GetAvailableSlotsDto } from '../dto/appointment.dto';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@ApiTags('نوبت ها - مراجع')
@Controller('appointments')
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class AppointmentController {
  constructor(private appointmentService: AppointmentService) {}

  @Get('available-slots')
  @RequirePermissions('appointment:slots:read')
  @ApiOperation({
    summary: 'دریافت زمان هاي در دسترس',
    description: 'دریافت اوقات دسترس پزشک برای حداکثر 10 روز آینده با تقویم فارسی',
  })
  @ApiQuery({ name: 'doctorId', required: true, example: '6649f4db5cf6b2c01f3d7b21', description: 'شناسه کاربر پزشک' })
  @ApiQuery({ name: 'days', required: false, example: 10, description: 'تعداد روزها (حداکثر 10)' })
  @ApiResponse({ status: 200, description: 'زمان های در دسترس با موفقیت دریافت شد' })
  async getAvailableSlots(@Query('doctorId') doctorId: string, @Query('days') days?: string): Promise<any> {
    const daysCount = days ? Number.parseInt(days, 10) : 10;
    if (Number.isNaN(daysCount) || daysCount <= 0) {
      throw new BadRequestException('مقدار days نامعتبر است');
    }
    if (daysCount > 10) {
      throw new BadRequestException('حداکثر تعداد روزها 10 است');
    }
    const slots = await this.appointmentService.getAvailableSlots(doctorId, daysCount);

    return {
      statusCode: 200,
      message: 'اوقات دسترس دریافت شد',
      data: slots,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('appointment:create')
  @ApiOperation({
    summary: 'ثبت نوبت جدید',
    description: 'ثبت نوبت جدید برای مراجعه به پزشک',
  })
  @ApiResponse({ status: 201, description: 'نوبت با موفقیت ایجاد شد' })
  async createAppointment(@Body() createAppointmentDto: CreateAppointmentDto, @Request() req: any): Promise<any> {
    const patientId = req.userId; // From JWT token
    const appointment = await this.appointmentService.createAppointment(createAppointmentDto, patientId);

    return {
      statusCode: 201,
      message: 'نوبت با موفقیت ثبت شد',
      data: appointment,
    };
  }

  @Get('my-appointments')
  @RequirePermissions('appointment:read:own')
  @ApiOperation({
    summary: 'دریافت نوبت های مراجع',
    description: 'دریافت لیست نوبت‌های مراجع',
  })
  @ApiResponse({ status: 200, description: 'نوبت ها با موفقیت دریافت شدند' })
  async getMyAppointments(@Request() req: any): Promise<any> {
    const patientId = req.userId;
    const appointments = await this.appointmentService.getPatientAppointments(patientId);

    return {
      statusCode: 200,
      message: 'نوبت‌های شما بازگردانده شد',
      data: appointments,
    };
  }

  @Put(':appointmentId/cancel')
  @RequirePermissions('appointment:cancel:own')
  @ApiOperation({
    summary: 'لغو نوبت',
    description: 'لغو نوبت مراجعه',
  })
  @ApiParam({ name: 'appointmentId', example: '6649f4db5cf6b2c01f3d7b21', description: 'شناسه نوبت' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', example: 'در دسترس نیست' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'نوبت با موفقیت لغو شد' })
  async cancelAppointment(@Param('appointmentId') appointmentId: string, @Body('reason') reason?: string): Promise<any> {
    const appointment = await this.appointmentService.updateAppointmentStatus(appointmentId, {
      status: 'cancelled',
      cancellationReason: reason,
    });

    return {
      statusCode: 200,
      message: 'نوبت لغو شد',
      data: appointment,
    };
  }
}

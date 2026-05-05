import { Controller, Post, Get, Put, Param, Body, UseGuards, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AppointmentService } from '../services/appointment.service';
import {
  CreateDoctorAvailabilityDto,
  UpdateDoctorAvailabilityDto,
  AddOffExceptionDto,
} from '../dto/doctor-availability.dto';
import { UpdateAppointmentStatusDto } from '../dto/appointment.dto';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { parseLimitQuery, parseSkipQuery } from '../../../common/utils/pagination-query.util';

@ApiTags('نوبت ها - مدیر')
@Controller('admin/appointments')
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class AdminAppointmentController {
  constructor(private appointmentService: AppointmentService) {}

  // ============= DOCTOR AVAILABILITY ENDPOINTS =============

  /**
   * Create doctor availability settings
   */
  @Post('doctors/:doctorId/availability')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('admin:availability:create')
  @ApiParam({ name: 'doctorId', example: '6649f4db5cf6b2c01f3d7b21', description: 'شناسه کاربر پزشک' })
  @ApiOperation({
    summary: 'ایجاد دسترس پذیری پزشک',
    description: 'تنظیم اولیه دسترس پذیری پزشک',
  })
  async createDoctorAvailability(
    @Param('doctorId') doctorId: string,
    @Body() createDto: CreateDoctorAvailabilityDto,
  ) {
    const availability = await this.appointmentService.createDoctorAvailability({
      ...createDto,
      doctorId,
    });

    return {
      statusCode: 201,
      message: 'اطلاعات دسترسی پزشک ایجاد شد',
      data: availability,
    };
  }

  /**
   * Get doctor availability
   */
  @Get('doctors/:doctorId/availability')
  @RequirePermissions('admin:availability:read')
  @ApiParam({ name: 'doctorId', example: '6649f4db5cf6b2c01f3d7b21', description: 'شناسه کاربر پزشک' })
  @ApiOperation({ summary: 'دریافت تنظیمات دسترس پذیری پزشک' })
  async getDoctorAvailability(@Param('doctorId') doctorId: string) {
    const availability = await this.appointmentService.getDoctorAvailability(doctorId);

    return {
      statusCode: 200,
      message: 'اطلاعات دسترسی پزشک بازگردانده شد',
      data: availability,
    };
  }

  /**
   * Update doctor availability
   */
  @Put('doctors/:doctorId/availability')
  @RequirePermissions('admin:availability:update')
  @ApiParam({ name: 'doctorId', example: '6649f4db5cf6b2c01f3d7b21', description: 'شناسه کاربر پزشک' })
  @ApiOperation({
    summary: 'به روزرسانی دسترس پذیری پزشک',
    description: 'به روزرسانی ساعات کاری، روزهای تعطیل، مدت زمان و حداکثر ظرفیت نوبت',
  })
  async updateDoctorAvailability(
    @Param('doctorId') doctorId: string,
    @Body() updateDto: UpdateDoctorAvailabilityDto,
  ) {
    const availability = await this.appointmentService.updateDoctorAvailability(doctorId, updateDto);

    return {
      statusCode: 200,
      message: 'اطلاعات دسترسی پزشک بروزرسانی شد',
      data: availability,
    };
  }

  /**
   * Add off exception (specific date when doctor is off)
   */
  @Post('doctors/:doctorId/off-exceptions')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('admin:availability:off-exception')
  @ApiParam({ name: 'doctorId', example: '6649f4db5cf6b2c01f3d7b21', description: 'شناسه کاربر پزشک' })
  @ApiOperation({
    summary: 'افزودن تاریخ استثناء تعطیلی',
    description: 'ثبت تاریخ مشخص برای تعطیلی پزشک (مرخصی، شرایط اضطراری و ...)',
  })
  async addOffException(
    @Param('doctorId') doctorId: string,
    @Body() addOffExceptionDto: AddOffExceptionDto,
  ) {
    const availability = await this.appointmentService.addOffException(doctorId, addOffExceptionDto);

    return {
      statusCode: 201,
      message: 'تاریخ رخصتی اضافه شد',
      data: availability,
    };
  }

  // ============= APPOINTMENT MANAGEMENT ENDPOINTS =============

  /**
   * Get all appointments (with optional filtering)
   */
  @Get('')
  @RequirePermissions('admin:appointments:read')
  @ApiQuery({ name: 'skip', required: false, example: 0, description: 'تعداد رکوردهای قابل نادیده گرفتن' })
  @ApiQuery({ name: 'limit', required: false, example: 20, description: 'تعداد در هر صفحه' })
  @ApiQuery({ name: 'status', required: false, example: 'confirmed', description: 'فیلتر بر اساس وضعیت' })
  @ApiOperation({ summary: 'دریافت همه نوبت ها', description: 'دریافت همه نوبت ها با امکان فیلتر وضعیت' })
  async getAllAppointments(
    @Query('skip') skip?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const skipNum = parseSkipQuery(skip, 0);
    const limitNum = parseLimitQuery(limit, 20);
    const result = await this.appointmentService.getAllAppointments(skipNum, limitNum, status as any);

    return {
      statusCode: 200,
      message: 'نوبت‌ها بازگردانده شدند',
      ...result,
    };
  }

  /**
   * Get doctor's appointments
   */
  @Get('doctors/:doctorId')
  @RequirePermissions('admin:appointments:read:doctor')
  @ApiParam({ name: 'doctorId', example: '6649f4db5cf6b2c01f3d7b21', description: 'شناسه کاربر پزشک' })
  @ApiQuery({ name: 'status', required: false, example: 'confirmed', description: 'فیلتر بر اساس وضعیت' })
  @ApiOperation({ summary: 'دریافت نوبت های پزشک' })
  async getDoctorAppointments(
    @Param('doctorId') doctorId: string,
    @Query('status') status?: string,
  ) {
    const appointments = await this.appointmentService.getDoctorAppointments(doctorId, status as any);

    return {
      statusCode: 200,
      message: 'نوبت‌های پزشک بازگردانده شدند',
      data: appointments,
    };
  }

  /**
   * Update appointment status
   */
  @Put(':appointmentId/status')
  @RequirePermissions('admin:appointments:status:update')
  @ApiParam({ name: 'appointmentId', example: '6649f4db5cf6b2c01f3d7b21', description: 'شناسه نوبت' })
  @ApiOperation({
    summary: 'به روزرسانی وضعیت نوبت',
    description: 'تغییر وضعیت نوبت (pending, confirmed, completed, cancelled, no_show)',
  })
  async updateAppointmentStatus(
    @Param('appointmentId') appointmentId: string,
    @Body() updateStatusDto: UpdateAppointmentStatusDto,
  ) {
    const appointment = await this.appointmentService.updateAppointmentStatus(appointmentId, updateStatusDto);

    return {
      statusCode: 200,
      message: 'وضعیت نوبت بروزرسانی شد',
      data: appointment,
    };
  }

  /**
   * Confirm appointment
   */
  @Put(':appointmentId/confirm')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('admin:appointments:confirm')
  @ApiParam({ name: 'appointmentId', example: '6649f4db5cf6b2c01f3d7b21', description: 'شناسه نوبت' })
  @ApiOperation({ summary: 'تایید نوبت' })
  async confirmAppointment(@Param('appointmentId') appointmentId: string) {
    const appointment = await this.appointmentService.updateAppointmentStatus(appointmentId, {
      status: 'confirmed',
    });

    return {
      statusCode: 200,
      message: 'نوبت تایید شد',
      data: appointment,
    };
  }

  /**
   * Complete appointment
   */
  @Put(':appointmentId/complete')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('admin:appointments:complete')
  @ApiParam({ name: 'appointmentId', example: '6649f4db5cf6b2c01f3d7b21', description: 'شناسه نوبت' })
  @ApiOperation({ summary: 'علامت گذاری نوبت به عنوان انجام شده' })
  async completeAppointment(@Param('appointmentId') appointmentId: string) {
    const appointment = await this.appointmentService.updateAppointmentStatus(appointmentId, {
      status: 'completed',
    });

    return {
      statusCode: 200,
      message: 'نوبت انجام شد',
      data: appointment,
    };
  }
}

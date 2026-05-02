import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('کاربران')
@Controller('users')
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('doctors')
  @RequirePermissions('appointment:doctors:read')
  @ApiOperation({ summary: 'دریافت لیست پزشکان' })
  async getDoctorsList() {
    const doctors = await this.userService.getDoctorsList();

    return {
      statusCode: 200,
      message: 'لیست پزشکان بازگردانده شد',
      data: doctors,
    };
  }
}

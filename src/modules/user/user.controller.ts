import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('کاربران')
@Controller('user')
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


  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'دریافت اطلاعات کاربر فعلی' })
  async getMe(@CurrentUser() userId: string) {
    const user = await this.userService.findById(userId);

    if (!user) {
      return {
        statusCode: 404,
        success: false,
        message: 'کاربر یافت نشد',
      };
    }

    const { password, __v, role, ...rest } = user.toObject ? user.toObject() : user;

    return {
      statusCode: 200,
      message: 'اطلاعات کاربر بازگردانده شد',
      data: rest,
    };
  }
}

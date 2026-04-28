import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { RoleService } from './role.service';
import { CreateRoleDto, UpdateRoleDto, GetRolesQueryDto } from './dto/role.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('نقش')
@Controller('roles')
@UseGuards(AuthGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @RequirePermissions('role:create')
  @ApiOperation({
    summary: 'ایجاد نقش جدید',
    description: 'ایجاد نقش جدید با مجوزهای مشخص شده',
  })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  @Get()
  @RequirePermissions('role:read')
  @ApiOperation({
    summary: 'دریافت همه نقش ها (صفحه بندی شده)',
    description: 'دریافت لیست تمام نقش‌ها با قابلیت صفحه‌بندی و جستجو',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    example: 0,
    description: 'تعداد رکوردهای قابل نادیده گرفتن',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'حداکثر تعداد رکوردهای بازگردانده شده (پیش فرض: 10)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    example: 'مدیر',
    description: 'جستجو در نام نقش',
  })
  findAll(@Query() query: GetRolesQueryDto) {
    return this.roleService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('role:read')
  @ApiOperation({
    summary: 'دریافت نقش بر اساس شناسه',
    description: 'دریافت اطلاعات یک نقش بر اساس شناسه',
  })
  @ApiParam({
    name: 'id',
    description: 'شناسه نقش',
    example: '60f7b1b9e4b0b8a1c8e4f1a1',
  })
  findOne(@Param('id') id: string) {
    return this.roleService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('role:update')
  @ApiOperation({
    summary: 'به روزرسانی نقش',
    description: 'به‌روزرسانی اطلاعات نقش',
  })
  @ApiParam({
    name: 'id',
    description: 'شناسه نقش',
    example: '60f7b1b9e4b0b8a1c8e4f1a1',
  })
  update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.roleService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @RequirePermissions('role:delete')
  @ApiOperation({
    summary: 'حذف نقش',
    description: 'حذف نقش',
  })
  @ApiParam({
    name: 'id',
    description: 'شناسه نقش',
    example: '60f7b1b9e4b0b8a1c8e4f1a1',
  })
  remove(@Param('id') id: string) {
    return this.roleService.remove(id);
  }
}

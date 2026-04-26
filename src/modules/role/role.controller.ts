import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { RoleService } from './role.service';
import { CreateRoleDto, UpdateRoleDto, GetRolesQueryDto } from './dto/role.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Role')
@Controller('roles')
@UseGuards(AuthGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @RequirePermissions('role:create')
  @ApiOperation({
    summary: 'Create New Role',
    description: 'ایجاد نقش جدید با مجوزهای مشخص شده',
  })
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  @Get()
  @RequirePermissions('role:read')
  @ApiOperation({
    summary: 'Get All Roles (Paginated)',
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
    summary: 'Get Role by ID',
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
    summary: 'Update Role',
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
    summary: 'Delete Role',
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

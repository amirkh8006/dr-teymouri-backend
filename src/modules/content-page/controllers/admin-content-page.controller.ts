import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ContentPageService } from '../services/content-page.service';
import { CreateContentPageDto, UpdateContentPageDto } from '../dto/content-page.dto';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@ApiTags('صفحات - مدیر')
@Controller('admin/pages')
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class AdminContentPageController {
  constructor(private readonly contentPageService: ContentPageService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('admin:pages:create')
  @ApiOperation({ summary: 'ایجاد صفحه جدید' })
  async createPage(@Body() createDto: CreateContentPageDto) {
    const page = await this.contentPageService.createPage(createDto);

    return {
      statusCode: 201,
      message: 'صفحه ایجاد شد',
      data: page,
    };
  }

  @Get()
  @RequirePermissions('admin:pages:read')
  @ApiOperation({ summary: 'دریافت همه صفحات (مدیر)' })
  @ApiQuery({ name: 'search', required: false, example: 'درباره', description: 'متن جستجو' })
  async getAllPages(@Query('search') search?: string) {
    const pages = await this.contentPageService.getAdminPages(search);

    return {
      statusCode: 200,
      message: 'لیست صفحات بازگردانده شد',
      data: pages,
    };
  }

  @Get(':id')
  @RequirePermissions('admin:pages:read')
  @ApiOperation({ summary: 'دریافت صفحه بر اساس شناسه (مدیر)' })
  @ApiParam({ name: 'id', example: '6649f4db5cf6b2c01f3d7b21', description: 'شناسه صفحه' })
  async getPageById(@Param('id') id: string) {
    const page = await this.contentPageService.getPageById(id);

    return {
      statusCode: 200,
      message: 'صفحه بازگردانده شد',
      data: page,
    };
  }

  @Put(':id')
  @RequirePermissions('admin:pages:update')
  @ApiOperation({ summary: 'به روزرسانی صفحه' })
  @ApiParam({ name: 'id', example: '6649f4db5cf6b2c01f3d7b21', description: 'شناسه صفحه' })
  async updatePage(@Param('id') id: string, @Body() updateDto: UpdateContentPageDto) {
    const page = await this.contentPageService.updatePage(id, updateDto);

    return {
      statusCode: 200,
      message: 'صفحه بروزرسانی شد',
      data: page,
    };
  }

  @Delete(':id')
  @RequirePermissions('admin:pages:delete')
  @ApiOperation({ summary: 'حذف صفحه' })
  @ApiParam({ name: 'id', example: '6649f4db5cf6b2c01f3d7b21', description: 'شناسه صفحه' })
  async deletePage(@Param('id') id: string) {
    await this.contentPageService.deletePage(id);

    return {
      statusCode: 200,
      message: 'صفحه حذف شد',
    };
  }
}

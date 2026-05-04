import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ContentPageService } from '../services/content-page.service';

@ApiTags('صفحات - عمومی')
@Controller('pages')
export class ContentPageController {
  constructor(private readonly contentPageService: ContentPageService) {}

  @Get()
  @ApiOperation({ summary: 'دریافت لیست صفحات' })
  @ApiQuery({ name: 'search', required: false, example: 'درباره', description: 'متن جستجو' })
  async getAllPages(@Query('search') search?: string) {
    const pages = await this.contentPageService.getAdminPages(search);

    return {
      statusCode: 200,
      message: 'لیست صفحات بازگردانده شد',
      data: pages,
    };
  }

  @Get(':slug')
  @ApiOperation({ summary: 'دریافت صفحه بر اساس اسلاگ' })
  @ApiParam({ name: 'slug', example: 'about-us', description: 'اسلاگ صفحه' })
  async getPageBySlug(@Param('slug') slug: string) {
    const page = await this.contentPageService.getPageBySlug(slug);

    return {
      statusCode: 200,
      message: 'صفحه بازگردانده شد',
      data: page,
    };
  }
}

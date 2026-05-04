import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ArticleService } from '../services/article.service';

@ApiTags('مقالات - عمومی')
@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  @ApiOperation({ summary: 'دریافت همه مقالات منتشر شده' })
  @ApiQuery({ name: 'page', required: false, example: 1, description: 'شماره صفحه' })
  @ApiQuery({ name: 'limit', required: false, example: 20, description: 'تعداد در هر صفحه' })
  @ApiQuery({ name: 'search', required: false, example: 'تغذیه', description: 'متن جستجو' })
  async getAllArticles(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? Number.parseInt(page, 10) : 1;
    const limitNum = limit ? Number.parseInt(limit, 10) : 20;
    const result = await this.articleService.getPublicArticles(pageNum, limitNum, search);

    return {
      statusCode: 200,
      message: 'لیست مقالات بازگردانده شد',
      ...result,
    };
  }

  @Get('suggested')
  @ApiOperation({ summary: 'دریافت مقالات پیشنهادی' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'حد اکثر تعداد' })
  async getSuggestedArticles(@Query('limit') limit?: string) {
    const limitNum = limit ? Number.parseInt(limit, 10) : 10;
    const articles = await this.articleService.getSuggestedArticles(limitNum);

    return {
      statusCode: 200,
      message: 'مقالات پیشنهادی بازگردانده شدند',
      data: articles,
    };
  }

  @Get('popular')
  @ApiOperation({ summary: 'دریافت مقالات محبوب' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'حد اکثر تعداد' })
  async getPopularArticles(@Query('limit') limit?: string) {
    const limitNum = limit ? Number.parseInt(limit, 10) : 10;
    const articles = await this.articleService.getPopularArticles(limitNum);

    return {
      statusCode: 200,
      message: 'مقالات محبوب بازگردانده شدند',
      data: articles,
    };
  }

  @Get('new')
  @ApiOperation({ summary: 'دریافت مقالات جدید' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'حد اکثر تعداد' })
  async getNewArticles(@Query('limit') limit?: string) {
    const limitNum = limit ? Number.parseInt(limit, 10) : 10;
    const articles = await this.articleService.getNewArticles(limitNum);

    return {
      statusCode: 200,
      message: 'مقالات جدید بازگردانده شدند',
      data: articles,
    };
  }

  @Get(':slug')
  @ApiOperation({ summary: 'دریافت مقاله بر اساس اسلاگ' })
  @ApiParam({ name: 'slug', example: 'healthy-eating-tips', description: 'اسلاگ مقاله' })
  async getArticleBySlug(@Param('slug') slug: string) {
    const article = await this.articleService.getArticleBySlug(slug);

    return {
      statusCode: 200,
      message: 'مقاله بازگردانده شد',
      data: article,
    };
  }
}

import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { parseLimitQuery, parseSkipQuery } from '../../../common/utils/pagination-query.util';
import { ArticleService } from '../services/article.service';

@ApiTags('مقالات - عمومی')
@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  @ApiOperation({ summary: 'دریافت همه مقالات منتشر شده' })
  @ApiQuery({ name: 'skip', required: false, example: 0, description: 'تعداد رکوردهای قابل نادیده گرفتن' })
  @ApiQuery({ name: 'limit', required: false, example: 20, description: 'تعداد در هر صفحه' })
  @ApiQuery({ name: 'search', required: false, example: 'تغذیه', description: 'متن جستجو' })
  async getAllArticles(
    @Query('skip') skip?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const skipNum = parseSkipQuery(skip, 0);
    const limitNum = parseLimitQuery(limit, 20);
    const result = await this.articleService.getPublicArticles(skipNum, limitNum, search);

    return {
      statusCode: 200,
      message: 'لیست مقالات بازگردانده شد',
      ...result,
    };
  }

  @Get('suggested')
  @ApiOperation({ summary: 'دریافت مقالات پیشنهادی' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'حد اکثر تعداد (حداکثر 100)' })
  async getSuggestedArticles(@Query('limit') limit?: string) {
    const limitNum = parseLimitQuery(limit, 10);
    const articles = await this.articleService.getSuggestedArticles(limitNum);

    return {
      statusCode: 200,
      message: 'مقالات پیشنهادی بازگردانده شدند',
      data: articles,
    };
  }

  @Get('popular')
  @ApiOperation({ summary: 'دریافت مقالات محبوب' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'حد اکثر تعداد (حداکثر 100)' })
  async getPopularArticles(@Query('limit') limit?: string) {
    const limitNum = parseLimitQuery(limit, 10);
    const articles = await this.articleService.getPopularArticles(limitNum);

    return {
      statusCode: 200,
      message: 'مقالات محبوب بازگردانده شدند',
      data: articles,
    };
  }

  @Get('new')
  @ApiOperation({ summary: 'دریافت مقالات جدید' })
  @ApiQuery({ name: 'limit', required: false, example: 10, description: 'حد اکثر تعداد (حداکثر 100)' })
  async getNewArticles(@Query('limit') limit?: string) {
    const limitNum = parseLimitQuery(limit, 10);
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

import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ArticleService } from '../services/article.service';
import { CreateArticleDto, UpdateArticleDto } from '../dto/article.dto';
import { AuthGuard } from '../../../common/guards/auth.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import type { Multer } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, isAbsolute, join, posix } from 'path';
import { parseLimitQuery, parseSkipQuery } from '../../../common/utils/pagination-query.util';

const DEFAULT_UPLOAD_DIR = 'uploads';
const UPLOAD_ROUTE = '/uploads';

const resolveUploadDir = () => {
  const uploadDir = process.env.UPLOAD_DIR || DEFAULT_UPLOAD_DIR;
  return isAbsolute(uploadDir) ? uploadDir : join(process.cwd(), uploadDir);
};

const ensureUploadDir = () => {
  const uploadDir = resolveUploadDir();
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

const buildPublicPath = (filename: string) => posix.join(UPLOAD_ROUTE, filename);

@ApiTags('مقالات - مدیر')
@Controller('admin/articles')
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class AdminArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('admin:articles:create')
  @UseInterceptors(
    FileInterceptor('thumbnail', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = ensureUploadDir();
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
    }),
  )
  @ApiOperation({ summary: 'ایجاد مقاله جدید' })
  async createArticle(
    @Body() createDto: CreateArticleDto,
    @CurrentUser() userId: string,
    @UploadedFile() file?: Multer.File,
  ) {
    if (file) {
      createDto.thumbnail = buildPublicPath(file.filename);
    }
    if (!createDto.thumbnail) {
      throw new BadRequestException('تصویر شاخص الزامی است');
    }

    const article = await this.articleService.createArticle(createDto, userId);

    return {
      statusCode: 201,
      message: 'مقاله ایجاد شد',
      data: article,
    };
  }

  @Get()
  @RequirePermissions('admin:articles:read')
  @ApiOperation({ summary: 'دریافت همه مقالات (مدیر)' })
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
    const result = await this.articleService.getAdminArticles(skipNum, limitNum, search);

    return {
      statusCode: 200,
      message: 'لیست مقالات بازگردانده شد',
      ...result,
    };
  }

  @Get(':id')
  @RequirePermissions('admin:articles:read')
  @ApiOperation({ summary: 'دریافت مقاله بر اساس شناسه (مدیر)' })
  @ApiParam({ name: 'id', example: '6649f4db5cf6b2c01f3d7b21', description: 'شناسه مقاله' })
  async getArticleById(@Param('id') id: string) {
    const article = await this.articleService.getArticleById(id);

    return {
      statusCode: 200,
      message: 'مقاله بازگردانده شد',
      data: article,
    };
  }

  @Put(':id')
  @RequirePermissions('admin:articles:update')
  @UseInterceptors(
    FileInterceptor('thumbnail', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = ensureUploadDir();
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
    }),
  )
  @ApiOperation({ summary: 'به روزرسانی مقاله' })
  @ApiParam({ name: 'id', example: '6649f4db5cf6b2c01f3d7b21', description: 'شناسه مقاله' })
  async updateArticle(
    @Param('id') id: string,
    @Body() updateDto: UpdateArticleDto,
    @UploadedFile() file?: Multer.File,
  ) {
    if (file) {
      updateDto.thumbnail = buildPublicPath(file.filename);
    }

    const article = await this.articleService.updateArticle(id, updateDto);

    return {
      statusCode: 200,
      message: 'مقاله بروزرسانی شد',
      data: article,
    };
  }

  @Delete(':id')
  @RequirePermissions('admin:articles:delete')
  @ApiOperation({ summary: 'حذف مقاله' })
  @ApiParam({ name: 'id', example: '6649f4db5cf6b2c01f3d7b21', description: 'شناسه مقاله' })
  async deleteArticle(@Param('id') id: string) {
    await this.articleService.deleteArticle(id);

    return {
      statusCode: 200,
      message: 'مقاله حذف شد',
    };
  }
}

import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Article, ArticleDocument } from '../schemas/article.schema';
import { CreateArticleDto, UpdateArticleDto } from '../dto/article.dto';
import { User, UserDocument } from '../../user/schemas/user.schema';

@Injectable()
export class ArticleService {
  constructor(
    @InjectModel(Article.name) private readonly articleModel: Model<ArticleDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async createArticle(createDto: CreateArticleDto, currentUserId?: string): Promise<ArticleDocument> {
    const authorId = createDto.authorId || currentUserId;
    if (!authorId) {
      throw new BadRequestException('نویسنده مشخص نیست');
    }

    await this.ensureAuthorExists(authorId);

    const slugSource = createDto.slug && createDto.slug.trim().length > 0 ? createDto.slug : createDto.title;
    const slug = this.normalizeSlug(slugSource);
    if (!slug) {
      throw new BadRequestException('اسلاگ نامعتبر است');
    }

    const existing = await this.articleModel.exists({ slug });
    if (existing) {
      throw new ConflictException('این اسلاگ قبلا استفاده شده است');
    }

    const readingTime = this.estimateReadingTime(createDto.content);
    const isPublished = createDto.isPublished ?? false;
    const publishedAt = isPublished ? (createDto.publishedAt ? new Date(createDto.publishedAt) : new Date()) : null;

    return this.articleModel.create({
      title: createDto.title,
      slug,
      thumbnail: createDto.thumbnail,
      author: new Types.ObjectId(authorId),
      content: createDto.content,
      readingTime,
      isPublished,
      publishedAt,
      isSuggested: createDto.isSuggested ?? false,
      viewCount: 0,
    });
  }

  async updateArticle(articleId: string, updateDto: UpdateArticleDto): Promise<ArticleDocument> {
    if (!Types.ObjectId.isValid(articleId)) {
      throw new NotFoundException('مقاله یافت نشد');
    }

    const article = await this.articleModel.findById(articleId);
    if (!article) {
      throw new NotFoundException('مقاله یافت نشد');
    }

    if (updateDto.authorId) {
      await this.ensureAuthorExists(updateDto.authorId);
      article.author = new Types.ObjectId(updateDto.authorId);
    }

    if (updateDto.title) {
      article.title = updateDto.title;
    }

    if (updateDto.thumbnail) {
      article.thumbnail = updateDto.thumbnail;
    }

    if (updateDto.content) {
      article.content = updateDto.content;
      article.readingTime = this.estimateReadingTime(updateDto.content);
    }

    if (updateDto.slug) {
      const slug = this.normalizeSlug(updateDto.slug);
      if (!slug) {
        throw new BadRequestException('اسلاگ نامعتبر است');
      }

      const existing = await this.articleModel.exists({ slug, _id: { $ne: article.id } });
      if (existing) {
        throw new ConflictException('این اسلاگ قبلا استفاده شده است');
      }

      article.slug = slug;
    }

    if (updateDto.isPublished !== undefined) {
      article.isPublished = updateDto.isPublished;
      if (!updateDto.isPublished) {
        article.publishedAt = null;
      } else if (!article.publishedAt) {
        article.publishedAt = updateDto.publishedAt ? new Date(updateDto.publishedAt) : new Date();
      }
    }

    if (updateDto.publishedAt && article.isPublished) {
      article.publishedAt = new Date(updateDto.publishedAt);
    }

    if (updateDto.isSuggested !== undefined) {
      article.isSuggested = updateDto.isSuggested;
    }

    return article.save();
  }

  async deleteArticle(articleId: string): Promise<void> {
    if (!Types.ObjectId.isValid(articleId)) {
      throw new NotFoundException('مقاله یافت نشد');
    }

    const deleted = await this.articleModel.findByIdAndDelete(articleId).exec();
    if (!deleted) {
      throw new NotFoundException('مقاله یافت نشد');
    }
  }

  async getArticleById(articleId: string): Promise<ArticleDocument> {
    if (!Types.ObjectId.isValid(articleId)) {
      throw new NotFoundException('مقاله یافت نشد');
    }

    const article = await this.articleModel
      .findById(articleId)
      .populate('author', 'firstName lastName')
      .exec();
    if (!article) {
      throw new NotFoundException('مقاله یافت نشد');
    }

    return article;
  }

  async getAdminArticles(skip: number, limit: number, search?: string): Promise<any> {
    const query: any = {};

    if (search) {
      query.$or = [{ title: new RegExp(search, 'i') }, { slug: new RegExp(search, 'i') }];
    }

    const [articles, total] = await Promise.all([
      this.articleModel
        .find(query)
        .populate('author', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.articleModel.countDocuments(query),
    ]);

    return {
      data: articles,
      pagination: {
        total,
        skip,
        limit,
      },
    };
  }

  async getPublicArticles(skip: number, limit: number, search?: string): Promise<any> {
    const query: any = { isPublished: true };

    if (search) {
      query.$or = [{ title: new RegExp(search, 'i') }, { slug: new RegExp(search, 'i') }];
    }

    const [articles, total] = await Promise.all([
      this.articleModel
        .find(query)
        .select('-content')
        .populate('author', 'firstName lastName -_id')
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.articleModel.countDocuments(query),
    ]);

    return {
      data: articles,
      pagination: {
        total,
        skip,
        limit,
      },
    };
  }

  async getSuggestedArticles(limit: number): Promise<ArticleDocument[]> {
    return this.articleModel
      .find({ isPublished: true, isSuggested: true })
      .select('-content')
      .populate('author', 'firstName lastName -_id')
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getPopularArticles(limit: number): Promise<ArticleDocument[]> {
    return this.articleModel
      .find({ isPublished: true })
      .select('-content')
      .populate('author', 'firstName lastName -_id')
      .sort({ viewCount: -1, publishedAt: -1 })
      .limit(limit)
      .exec();
  }

  async getNewArticles(limit: number): Promise<ArticleDocument[]> {
    return this.articleModel
      .find({ isPublished: true })
      .select('-content')
      .populate('author', 'firstName lastName -_id')
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getArticleBySlug(slug: string): Promise<ArticleDocument> {
    const article = await this.articleModel
      .findOneAndUpdate({ slug, isPublished: true }, { $inc: { viewCount: 1 } }, { new: true })
      .populate('author', 'firstName lastName -_id')
      .exec();

    if (!article) {
      throw new NotFoundException('مقاله یافت نشد');
    }

    return article;
  }

  private estimateReadingTime(content: string): number {
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(wordCount / 200));
  }

  private normalizeSlug(source: string): string {
    return source
      .toLowerCase()
      .trim()
      .replace(/["']/g, '')
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async ensureAuthorExists(authorId: string): Promise<void> {
    if (!Types.ObjectId.isValid(authorId)) {
      throw new BadRequestException('شناسه نویسنده نامعتبر است');
    }

    const exists = await this.userModel.exists({ _id: new Types.ObjectId(authorId) });
    if (!exists) {
      throw new NotFoundException('نویسنده یافت نشد');
    }
  }
}

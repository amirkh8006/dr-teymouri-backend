import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateContentPageDto, UpdateContentPageDto, ContentPageTopicDto } from '../dto/content-page.dto';
import { ContentPage, ContentPageDocument, ContentPageTopic } from '../schemas/content-page.schema';

@Injectable()
export class ContentPageService {
  constructor(@InjectModel(ContentPage.name) private readonly contentPageModel: Model<ContentPageDocument>) {}

  async createPage(createDto: CreateContentPageDto): Promise<ContentPageDocument> {
    const slugSource = createDto.slug && createDto.slug.trim().length > 0 ? createDto.slug : createDto.title;
    const slug = this.normalizeSlug(slugSource);
    if (!slug) {
      throw new BadRequestException('اسلاگ نامعتبر است');
    }

    const existing = await this.contentPageModel.exists({ slug });
    if (existing) {
      throw new ConflictException('این اسلاگ قبلا استفاده شده است');
    }

    const topics = this.normalizeTopics(createDto.topics);

    return this.contentPageModel.create({
      title: createDto.title,
      slug,
      topics: topics ?? [],
    });
  }

  async updatePage(pageId: string, updateDto: UpdateContentPageDto): Promise<ContentPageDocument> {
    if (!Types.ObjectId.isValid(pageId)) {
      throw new NotFoundException('صفحه یافت نشد');
    }

    const page = await this.contentPageModel.findById(pageId);
    if (!page) {
      throw new NotFoundException('صفحه یافت نشد');
    }

    if (updateDto.title) {
      page.title = updateDto.title;
    }

    if (updateDto.slug) {
      const slug = this.normalizeSlug(updateDto.slug);
      if (!slug) {
        throw new BadRequestException('اسلاگ نامعتبر است');
      }

      const existing = await this.contentPageModel.exists({ slug, _id: { $ne: page.id } });
      if (existing) {
        throw new ConflictException('این اسلاگ قبلا استفاده شده است');
      }

      page.slug = slug;
    }

    if (updateDto.topics) {
      page.topics = this.normalizeTopics(updateDto.topics) ?? [];
    }

    return page.save();
  }

  async deletePage(pageId: string): Promise<void> {
    if (!Types.ObjectId.isValid(pageId)) {
      throw new NotFoundException('صفحه یافت نشد');
    }

    const deleted = await this.contentPageModel.findByIdAndDelete(pageId).exec();
    if (!deleted) {
      throw new NotFoundException('صفحه یافت نشد');
    }
  }

  async getPageById(pageId: string): Promise<ContentPageDocument> {
    if (!Types.ObjectId.isValid(pageId)) {
      throw new NotFoundException('صفحه یافت نشد');
    }

    const page = await this.contentPageModel.findById(pageId).exec();
    if (!page) {
      throw new NotFoundException('صفحه یافت نشد');
    }

    return page;
  }

  async getAdminPages(search?: string): Promise<ContentPageDocument[]> {
    const query: Record<string, any> = {};
    if (search) {
      query.$or = [{ title: new RegExp(search, 'i') }, { slug: new RegExp(search, 'i') }];
    }

    return this.contentPageModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async getPageBySlug(slug: string): Promise<ContentPageDocument> {
    const page = await this.contentPageModel.findOne({ slug }).exec();
    if (!page) {
      throw new NotFoundException('صفحه یافت نشد');
    }

    return page;
  }

  private normalizeTopics(topics?: ContentPageTopicDto[]): ContentPageTopic[] | undefined {
    if (!topics) {
      return undefined;
    }

    return topics
      .map((topic) => ({
        title: topic.title.trim(),
        contentHtml: topic.contentHtml,
        order: topic.order ?? 0,
      }))
      .sort((a, b) => a.order - b.order);
  }

  private normalizeSlug(source: string): string {
    return source
      .toLowerCase()
      .trim()
      .replace(/["']/g, '')
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '');
  }
}

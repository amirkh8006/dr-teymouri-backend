import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../user/schemas/user.schema';

export type ArticleDocument = HydratedDocument<Article>;

@Schema({ timestamps: true, versionKey: false })
export class Article {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true, unique: true, index: true })
  slug!: string;

  @Prop({ required: true, trim: true })
  thumbnail!: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  author!: Types.ObjectId;

  @Prop({ required: true })
  content!: string;

  @Prop({ required: true })
  readingTime!: number; // Minutes

  @Prop({ default: false })
  isPublished!: boolean;

  @Prop({ type: Date, default: null })
  publishedAt?: Date | null;

  @Prop({ default: false })
  isSuggested!: boolean;

  @Prop({ default: 0 })
  viewCount!: number;
}

export const ArticleSchema = SchemaFactory.createForClass(Article);

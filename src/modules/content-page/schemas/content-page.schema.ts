import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ContentPageDocument = HydratedDocument<ContentPage>;

@Schema({ _id: false })
export class ContentPageTopic {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true })
  contentHtml!: string;

  @Prop({ default: 0 })
  order!: number;
}

const ContentPageTopicSchema = SchemaFactory.createForClass(ContentPageTopic);

@Schema({ timestamps: true, versionKey: false })
export class ContentPage {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true, unique: true, index: true })
  slug!: string;

  @Prop({ type: [ContentPageTopicSchema], default: [] })
  topics!: ContentPageTopic[];
}

export const ContentPageSchema = SchemaFactory.createForClass(ContentPage);

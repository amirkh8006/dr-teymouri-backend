import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentPage, ContentPageSchema } from './schemas/content-page.schema';
import { ContentPageService } from './services/content-page.service';
import { ContentPageController } from './controllers/content-page.controller';
import { AdminContentPageController } from './controllers/admin-content-page.controller';
import { User, UserSchema } from '../user/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ContentPage.name, schema: ContentPageSchema },
      { name: User.name, schema: UserSchema },
    ])],
  controllers: [ContentPageController, AdminContentPageController],
  providers: [ContentPageService],
  exports: [ContentPageService],
})
export class ContentPageModule {}

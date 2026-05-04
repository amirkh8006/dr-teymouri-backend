import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Article, ArticleSchema } from './schemas/article.schema';
import { ArticleService } from './services/article.service';
import { ArticleController } from './controllers/article.controller';
import { AdminArticleController } from './controllers/admin-article.controller';
import { User, UserSchema } from '../user/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Article.name, schema: ArticleSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ArticleController, AdminArticleController],
  providers: [ArticleService],
  exports: [ArticleService],
})
export class ArticleModule {}

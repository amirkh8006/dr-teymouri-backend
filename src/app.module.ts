import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { RoleModule } from './modules/role/role.module';
import { UserModule } from './modules/user/user.module';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { ArticleModule } from './modules/article/article.module';
import { MongodbModule } from './infrastructure/mongodb/mongodb.module';
import { ContentPageModule } from './modules/content-page/content-page.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    MongodbModule,
    AuthModule,
    RoleModule,
    UserModule,
    AppointmentModule,
    ArticleModule,
    ContentPageModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

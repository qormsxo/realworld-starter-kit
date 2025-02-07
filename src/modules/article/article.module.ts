import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './article.entity';
import { Tag } from '../tag/tag.entity';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { User } from '../user/user.entity';
import { JwtModule } from '@nestjs/jwt';
import * as dotenv from 'dotenv';
import { AuthModule } from 'src/auth/auth.module';
dotenv.config();  // .env 파일을 로드하여 process.env에 환경 변수 추가


@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Article,Tag,User]),
  ],
  providers: [ArticleService], 
  controllers: [ArticleController],
})
export class ArticleModule {}
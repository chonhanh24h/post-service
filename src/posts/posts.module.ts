import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { S3Service } from './s3.service';
import { Post, PostSchema } from '../schemas/post.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
  ],
  providers: [PostsService, S3Service],
  controllers: [PostsController],
  exports: [PostsService, S3Service],
})
export class PostsModule {}


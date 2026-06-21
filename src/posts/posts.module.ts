import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { S3Service } from './s3.service';
import { Post, PostSchema } from '../schemas/post.schema';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
    ]),
    ClientsModule.registerAsync([
      {
        name: 'CORE_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get('CORE_SERVICE_HOST'),
            port: configService.get('CORE_SERVICE_PORT'),
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [PostsService, S3Service],
  controllers: [PostsController],
  exports: [PostsService, S3Service],
})
export class PostsModule {}


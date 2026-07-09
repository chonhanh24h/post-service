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
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    ClientsModule.registerAsync([
      {
        name: 'CORE_SERVICE',
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('CORE_SERVICE_HOST') || '127.0.0.1',
            port:
              parseInt(
                configService.get<string>('CORE_SERVICE_PORT') ?? '3002',
                10,
              ) || 3002,
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
export class PostsModule { }

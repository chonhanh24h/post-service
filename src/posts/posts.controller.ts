import { Controller, UsePipes, ValidationPipe } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PostsService } from './posts.service';
import { S3Service } from './s3.service';

@Controller()
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly s3Service: S3Service,
  ) { }

  @MessagePattern({ cmd: 'get_all_posts' })
  async findAll(@Payload() query: any) {
    return this.postsService.findAll(query);
  }

  @MessagePattern({ cmd: 'get_posts_by_user' })
  async findByUserId(@Payload() userId: string) {
    return this.postsService.findByUserId(userId);
  }

  @MessagePattern({ cmd: 'get_post_by_id' })
  async findOne(@Payload() id: string) {
    return this.postsService.findOne(id);
  }

  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @MessagePattern({ cmd: 'create_post' })
  async create(@Payload() createPostDto: CreatePostDto) {
    return this.postsService.create(createPostDto);
  }

  @MessagePattern({ cmd: 'update_post' })
  async update(@Payload() data: any) {
    return this.postsService.update(data.id, data.updatePostDto);
  }

  @MessagePattern({ cmd: 'remove_post' })
  async remove(@Payload() id: string) {
    return this.postsService.remove(id);
  }

  /**
   * Generates a presigned S3 PUT URL so the browser can upload directly to S3.
   * Called by the API Gateway when it receives POST /posts/upload-url.
   * Returns { presignedUrl, imageUrl }.
   */
  @MessagePattern({ cmd: 'upload_presigned_url' })
  async getUploadUrl(@Payload() payload: { fileName: string; fileType: string }) {
    return this.s3Service.getPresignedUploadUrl(payload.fileName, payload.fileType);
  }
}

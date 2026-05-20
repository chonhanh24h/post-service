import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PostsService } from './posts.service';

@Controller()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

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

  @MessagePattern({ cmd: 'create_post' })
  async create(@Payload() createPostDto: any) {
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
}

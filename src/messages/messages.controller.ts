import { Controller, Get } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MessagesService } from './messages.service';

@Controller()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) { }

  @MessagePattern({ cmd: 'get_all_messages' })
  async findAll(@Payload() query: any) {
    return this.messagesService.findAll(query);
  }

  @Get(':id')
  @MessagePattern({ cmd: 'get_message_by_id' })
  async findOne(@Payload() id: string) {
    return this.messagesService.findOne(id);
  }

  @MessagePattern({ cmd: 'create_message' })
  async create(@Payload() createMessageDto: any) {
    return this.messagesService.create(createMessageDto);
  }

  @MessagePattern({ cmd: 'update_message' })
  async update(@Payload() data: any) {
    return this.messagesService.update(data.id, data.updateMessageDto);
  }

  @MessagePattern({ cmd: 'remove_message' })
  async remove(@Payload() id: string) {
    return this.messagesService.remove(id);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from '../schemas/message.schema';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<Message>,
  ) {}

  async findAll(query: any = {}): Promise<Message[]> {
    return this.messageModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Message | null> {
    return this.messageModel.findById(id).exec();
  }

  async create(createMessageDto: any): Promise<Message> {
    const createdMessage = new this.messageModel(createMessageDto);
    return createdMessage.save();
  }

  async update(id: string, updateMessageDto: any): Promise<Message | null> {
    return this.messageModel
      .findByIdAndUpdate(id, updateMessageDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<any> {
    return this.messageModel.findByIdAndDelete(id).exec();
  }
}

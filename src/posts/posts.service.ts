import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from '../schemas/post.schema';

@Injectable()
export class PostsService {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}

  async findAll(query: any = {}): Promise<PostDocument[]> {
    return this.postModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<PostDocument | null> {
    return this.postModel.findById(id).exec();
  }

  async findByUserId(userId: string): Promise<PostDocument[]> {
    return this.postModel.find({ userID: userId as any }).sort({ createdAt: -1 }).exec();
  }

  async create(createPostDto: any): Promise<PostDocument> {
    const createdPost = new this.postModel(createPostDto);
    return createdPost.save();
  }

  async update(id: string, updatePostDto: any): Promise<PostDocument | null> {
    return this.postModel
      .findByIdAndUpdate(id, updatePostDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<any> {
    return this.postModel.findByIdAndDelete(id).exec();
  }
}

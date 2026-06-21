import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from '../schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @Inject('CORE_SERVICE') private coreServiceClient: ClientProxy,
  ) { }

  async findAll(query: any = {}): Promise<PostDocument[]> {
    const { page, limit, q, sort, ...filter } = query;
    const pageNumber = parseInt(page as string, 10) || 1;
    const limitNumber = 20;
    const skip = (pageNumber - 1) * limitNumber;
    if (q) {
      filter.title = { $regex: q, $options: 'i' };
    }
    filter.status = 2;

    let sortCondition: any = { createdAt: -1 };
    switch (sort) {
      case 'price_asc':
        sortCondition = { price: 1 };
        break;
      case 'price_desc':
        sortCondition = { price: -1 };
        break;
    }

    return this.postModel
      .find(filter)
      .sort(sortCondition)
      .skip(skip)
      .limit(limitNumber)
      .exec();
  }

  async findOne(id: string): Promise<PostDocument | null> {
    return this.postModel.findById(id).exec();
  }

  async findByUserId(userId: string): Promise<PostDocument[]> {
    return this.postModel.find({ userID: userId as any }).sort({ createdAt: -1 }).exec();
  }

  async create(createPostDto: CreatePostDto): Promise<PostDocument> {
    // Determine post status, default to 2 (Đã duyệt/Chờ duyệt) as per plan
    const status = 2;

    const categoryID = createPostDto.categoryID || (createPostDto as any).post_category;
    if (!categoryID) {
      throw new BadRequestException('Category is required');
    }

    const category = await firstValueFrom(this.coreServiceClient.send({ cmd: 'get_category_by_id' }, categoryID)).catch(() => null);
    if (!category) {
      throw new BadRequestException('Category not found');
    }

    let area = null;
    const areaID = createPostDto.areaID || (createPostDto as any).post_area;
    if (areaID) {
      area = await firstValueFrom(this.coreServiceClient.send({ cmd: 'get_city_by_id' }, areaID)).catch(() => null);
      if (!area) {
        throw new BadRequestException('Area not found');
      }
    }

    let city = null;
    const cityID = createPostDto.cityID || (createPostDto as any).post_city;
    if (cityID) {
      city = await firstValueFrom(this.coreServiceClient.send({ cmd: 'get_city_by_id' }, cityID)).catch(() => null);
      if (!city) {
        throw new BadRequestException('City not found');
      }
    }

    const postData = {
      userID: createPostDto.userID,
      email: createPostDto.user_email,
      phone: createPostDto.user_phone,
      name: createPostDto.user_name,
      user_type: createPostDto.user_type,
      categoryID: categoryID,
      category: category.name,
      category_alias: category.alias,
      post_type: createPostDto.post_type,
      title: createPostDto.title || (createPostDto as any).post_title,
      content: createPostDto.content || (createPostDto as any).post_content,
      price: createPostDto.price || (createPostDto as any).post_price,
      image: createPostDto.post_images || [],
      areaID: areaID,
      area: area?.name,
      area_alias: area?.alias,
      cityID: cityID,
      city: city?.name,
      city_alias: city?.alias,
      status: status,
    };

    const createdPost = new this.postModel(postData);
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

import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from '../schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
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

    const categoryID = createPostDto.categoryID;

    if (!categoryID) {
      throw new BadRequestException('Category is required');
    }

    const category = await firstValueFrom(this.coreServiceClient.send({ cmd: 'get_category_by_id' }, categoryID)).catch(() => null);
    if (!category) {
      throw new BadRequestException('Category not found');
    }

    let area = null;
    const areaID = createPostDto.areaID;
    if (areaID) {
      area = await firstValueFrom(this.coreServiceClient.send({ cmd: 'get_city_by_id' }, areaID)).catch(() => null);
      if (!area) {
        throw new BadRequestException('Area not found');
      }
    }

    let city = null;
    const cityID = createPostDto.cityID;
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
      title: createPostDto.title,
      content: createPostDto.content,
      price: createPostDto.price,
      image: createPostDto.image || [],
      areaID: areaID,
      area: area?.name,
      area_alias: area?.alias,
      cityID: cityID,
      city: city?.name,
      city_alias: city?.alias,
      status: status,
      address: createPostDto.address,
    };

    const createdPost = new this.postModel(postData);
    return createdPost.save();
  }

  async update(id: string, updatePostDto: UpdatePostDto): Promise<PostDocument | null> {
    if (updatePostDto.categoryID) {
      const category = await firstValueFrom(this.coreServiceClient.send({ cmd: 'get_category_by_id' }, updatePostDto.categoryID)).catch(() => null);
      if (!category) {
        throw new BadRequestException('Category not found');
      }
      updatePostDto.category = category.name;
      updatePostDto.category_alias = category.alias;
    }

    if (updatePostDto.areaID) {
      const area = await firstValueFrom(this.coreServiceClient.send({ cmd: 'get_city_by_id' }, updatePostDto.areaID)).catch(() => null);
      if (!area) {
        throw new BadRequestException('Area not found');
      }
      updatePostDto.area = area.name;
      updatePostDto.area_alias = area.alias;
    }

    if (updatePostDto.cityID) {
      const city = await firstValueFrom(this.coreServiceClient.send({ cmd: 'get_city_by_id' }, updatePostDto.cityID)).catch(() => null);
      if (!city) {
        throw new BadRequestException('City not found');
      }
      updatePostDto.city = city.name;
      updatePostDto.city_alias = city.alias;
    }

    if (updatePostDto.user_name) {
      updatePostDto.name = updatePostDto.user_name;
    }
    if (updatePostDto.user_email) {
      updatePostDto.email = updatePostDto.user_email;
    }
    if (updatePostDto.user_phone) {
      updatePostDto.phone = updatePostDto.user_phone;
    }

    return this.postModel
      .findByIdAndUpdate(id, updatePostDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<any> {
    return this.postModel.findByIdAndDelete(id).exec();
  }
}

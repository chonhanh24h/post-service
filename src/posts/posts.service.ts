import {
  Injectable,
  BadRequestException,
  Inject,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from '../schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

interface CategoryResponse {
  name: string;
  alias: string;
}

interface LocationResponse {
  name: string;
  alias: string;
}

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @Inject('CORE_SERVICE') private coreServiceClient: ClientProxy,
  ) {}

  private readonly limit = 10;

  async myAdsAnalytic(userId: string) {
    const posts = await this.postModel
      .find({ userID: new Types.ObjectId(userId) })
      .select({ status: 1 })
      .lean()
      .exec();

    const analytic = {
      block: 0,
      post: 0,
      wait: 0,
      done: 0,
      cancel: 0,
    };

    if (posts && posts.length > 0) {
      analytic.block = posts.filter(
        (o) => (o as { status: number }).status == 0,
      ).length;
      analytic.post = posts.filter(
        (o) => (o as { status: number }).status == 2,
      ).length;
      analytic.wait = posts.filter(
        (o) => (o as { status: number }).status == 1,
      ).length;
      analytic.done = posts.filter(
        (o) => (o as { status: number }).status == 3,
      ).length;
      analytic.cancel = posts.filter(
        (o) => (o as { status: number }).status == 4,
      ).length;
    }

    return analytic;
  }

  async myAds(userId: string, query: Record<string, string>) {
    let page = 1;
    const filter: Record<string, unknown> = {
      userID: new Types.ObjectId(userId),
    };

    if (query.page) {
      page = parseInt(query.page, 10);
    }
    const skip = (page - 1) * this.limit;

    if (query.type) {
      filter.status = parseInt(query.type, 10);
    }

    const posts = await this.postModel
      .find(filter)
      .select({
        category_alias: 1,
        title: 1,
        price: 1,
        image: 1,
        has_thumb: 1,
        city: 1,
        area: 1,
        createdAt: 1,
        status: 1,
      })
      .lean()
      .skip(skip)
      .limit(this.limit)
      .sort({ createdAt: -1 })
      .exec();

    const pageNext = posts.length === this.limit ? page + 1 : null;
    return { data: posts || [], pageNext, userID: userId };
  }

  async myAdsUpdateStatus(userId: string, body: Record<string, string>) {
    const { id, type } = body;

    if (!id || !type) {
      throw new HttpException(
        {
          status: false,
          msg: 'Kh\u00f4ng t\u00ecm th\u1ea5y tin \u0111\u0103ng ph\u00f9 h\u1ee3p!',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const typeNum = parseInt(type, 10);
    const query: Record<string, unknown> = {
      _id: id,
      userID: new Types.ObjectId(userId),
    };
    const statusConditions: { status: number }[] = [];

    switch (typeNum) {
      case 1:
        statusConditions.push({ status: 4 });
        break;
      case 3:
        statusConditions.push({ status: 2 });
        break;
      case 4:
        statusConditions.push({ status: 1 }, { status: 2 });
        break;
      case 6:
        statusConditions.push({ status: 3 }, { status: 4 }, { status: 5 });
        break;
    }

    query['$or'] = statusConditions;

    const post = await this.postModel
      .findOne(query)
      .select({ status: 1 })
      .exec();

    if (post) {
      post.status = typeNum;
      try {
        await post.save();
        return { status: true, old_status: post.status };
      } catch {
        throw new HttpException(
          {
            status: false,
            msg: 'C\u1eadp nh\u1eadt tr\u1ea1ng th\u00e1i th\u1ea5t b\u1ea1i!',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } else {
      throw new HttpException(
        {
          status: false,
          msg: 'Kh\u00f4ng t\u00ecm th\u1ea5y tin \u0111\u0103ng ph\u00f9 h\u1ee3p!',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findAll(query: Record<string, unknown> = {}): Promise<PostDocument[]> {
    const { page, limit, q, sort, ...filter } = query;
    void limit;
    const pageNumber = parseInt(page as string, 10) || 1;
    const limitNumber = 20;
    const skip = (pageNumber - 1) * limitNumber;
    if (q) {
      filter.title = { $regex: q, $options: 'i' };
    }
    filter.status = 2;

    let sortCondition = {};
    switch (sort) {
      case 'price_asc':
        sortCondition = { price: 1 };
        break;
      case 'price_desc':
        sortCondition = { price: -1 };
        break;
      default:
        sortCondition = { createdAt: -1 };
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
    return this.postModel
      .find({ userID: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getPostsByIds(
    ids: string[],
    skip: number,
    limit: number,
  ): Promise<unknown[]> {
    return this.postModel
      .find({ _id: { $in: ids } })
      .select({
        category_alias: 1,
        title: 1,
        price: 1,
        image: 1,
        has_thumb: 1,
        area: 1,
        city: 1,
        createdAt: 1,
      })
      .lean()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();
  }

  async checkPostExists(id: string): Promise<number> {
    return this.postModel.countDocuments({ _id: id }).exec();
  }

  async create(createPostDto: CreatePostDto): Promise<PostDocument> {
    // Determine post status, default to 2 (Da duyet/Cho duyet) as per plan
    const status = 2;

    const categoryID = createPostDto.categoryID;

    if (!categoryID) {
      throw new BadRequestException('Category is required');
    }

    const category = await firstValueFrom<CategoryResponse>(
      this.coreServiceClient.send<CategoryResponse>(
        { cmd: 'get_category_by_id' },
        categoryID,
      ),
    ).catch(() => null);
    if (!category) {
      throw new BadRequestException('Category not found');
    }

    let area: LocationResponse | null = null;
    const areaID = createPostDto.areaID;
    if (areaID) {
      area = await firstValueFrom<LocationResponse>(
        this.coreServiceClient.send<LocationResponse>(
          { cmd: 'get_city_by_id' },
          areaID,
        ),
      ).catch(() => null);
      if (!area) {
        throw new BadRequestException('Area not found');
      }
    }

    let city: LocationResponse | null = null;
    const cityID = createPostDto.cityID;
    if (cityID) {
      city = await firstValueFrom<LocationResponse>(
        this.coreServiceClient.send<LocationResponse>(
          { cmd: 'get_city_by_id' },
          cityID,
        ),
      ).catch(() => null);
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

  async update(
    id: string,
    updatePostDto: UpdatePostDto,
  ): Promise<PostDocument | null> {
    if (updatePostDto.categoryID) {
      const category = await firstValueFrom<CategoryResponse>(
        this.coreServiceClient.send<CategoryResponse>(
          { cmd: 'get_category_by_id' },
          updatePostDto.categoryID,
        ),
      ).catch(() => null);
      if (!category) {
        throw new BadRequestException('Category not found');
      }
      updatePostDto.category = category.name;
      updatePostDto.category_alias = category.alias;
    }

    if (updatePostDto.areaID) {
      const area = await firstValueFrom<LocationResponse>(
        this.coreServiceClient.send<LocationResponse>(
          { cmd: 'get_city_by_id' },
          updatePostDto.areaID,
        ),
      ).catch(() => null);
      if (!area) {
        throw new BadRequestException('Area not found');
      }
      updatePostDto.area = area.name;
      updatePostDto.area_alias = area.alias;
    }

    if (updatePostDto.cityID) {
      const city = await firstValueFrom<LocationResponse>(
        this.coreServiceClient.send<LocationResponse>(
          { cmd: 'get_city_by_id' },
          updatePostDto.cityID,
        ),
      ).catch(() => null);
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

  async remove(id: string): Promise<unknown> {
    return this.postModel.findByIdAndDelete(id).exec();
  }
}

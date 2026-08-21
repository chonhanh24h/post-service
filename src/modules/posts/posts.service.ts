import {
  Injectable,
  BadRequestException,
  Inject,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './post.schema';
import { PostStatus } from './const/post.enum';
import { POST_ERROR_MESSAGES } from './posts.consts';
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
        (o) => o.status === PostStatus.LOCKED,
      ).length;
      analytic.post = posts.filter(
        (o) => o.status === PostStatus.APPROVED,
      ).length;
      analytic.wait = posts.filter(
        (o) => o.status === PostStatus.PENDING,
      ).length;
      analytic.done = posts.filter(
        (o) => o.status === PostStatus.COMPLETED,
      ).length;
      analytic.cancel = posts.filter(
        (o) => o.status === PostStatus.CANCELED,
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
          msg: POST_ERROR_MESSAGES.NOT_FOUND,
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
        statusConditions.push({ status: PostStatus.CANCELED });
        break;
      case 3:
        statusConditions.push({ status: PostStatus.APPROVED });
        break;
      case 4:
        statusConditions.push(
          { status: PostStatus.PENDING },
          { status: PostStatus.APPROVED },
        );
        break;
      case 6:
        statusConditions.push(
          { status: PostStatus.COMPLETED },
          { status: PostStatus.CANCELED },
          { status: PostStatus.EXPIRED },
        );
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
            msg: POST_ERROR_MESSAGES.UPDATE_STATUS_FAILED,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } else {
      throw new HttpException(
        {
          status: false,
          msg: POST_ERROR_MESSAGES.NOT_FOUND,
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
    filter.status = PostStatus.APPROVED;

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
    return this.postModel
      .countDocuments({ _id: new Types.ObjectId(id) })
      .exec();
  }

  async create(createPostDto: CreatePostDto): Promise<PostDocument> {
    // Determine post status, default to APPROVED (Da duyet/Cho duyet) as per plan
    const status = PostStatus.APPROVED;

    const categoryID = createPostDto.categoryID;

    if (!categoryID) {
      throw new BadRequestException(POST_ERROR_MESSAGES.CATEGORY_REQUIRED);
    }

    const category = await firstValueFrom<CategoryResponse>(
      this.coreServiceClient.send<CategoryResponse>(
        { cmd: 'get_category_by_id' },
        categoryID,
      ),
    ).catch(() => null);
    if (!category) {
      throw new BadRequestException(POST_ERROR_MESSAGES.CATEGORY_NOT_FOUND);
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
        throw new BadRequestException(POST_ERROR_MESSAGES.AREA_NOT_FOUND);
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
        throw new BadRequestException(POST_ERROR_MESSAGES.CITY_NOT_FOUND);
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
        throw new BadRequestException(POST_ERROR_MESSAGES.CATEGORY_NOT_FOUND);
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
        throw new BadRequestException(POST_ERROR_MESSAGES.AREA_NOT_FOUND);
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
        throw new BadRequestException(POST_ERROR_MESSAGES.CITY_NOT_FOUND);
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

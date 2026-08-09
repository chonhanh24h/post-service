import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { PostStatus, PostType, AdsType, UserType } from './const/post.enum';

export type PostDocument = HydratedDocument<Post>;

@Schema({ timestamps: true })
export class Post {
  @Prop()
  email: string;

  @Prop()
  phone: string;

  @Prop()
  name: string;

  @Prop({
    type: Number,
    enum: Object.values(UserType).filter((v) => typeof v === 'number'),
    default: UserType.PERSONAL,
  })
  user_type: UserType;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userID: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category' })
  categoryID: Types.ObjectId;

  @Prop()
  category: string;

  @Prop()
  category_alias: string;

  @Prop({
    type: Number,
    enum: Object.values(PostType).filter((v) => typeof v === 'number'),
    default: PostType.SALE,
  })
  post_type: PostType;

  @Prop()
  title: string;

  @Prop()
  title_alias: string;

  @Prop()
  content: string;

  @Prop({ default: 0 })
  price: number;

  @Prop({ type: [String], default: [] })
  image: string[];

  @Prop({ default: true })
  has_thumb: boolean;

  @Prop()
  area: string;

  @Prop()
  area_alias: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'City' })
  areaID: Types.ObjectId;

  @Prop()
  city: string;

  @Prop()
  city_alias: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'City' })
  cityID: Types.ObjectId;

  @Prop()
  address: string;

  @Prop({
    type: Number,
    enum: Object.values(PostStatus).filter((v) => typeof v === 'number'),
    default: PostStatus.PENDING,
  })
  status: PostStatus;

  @Prop({
    type: Number,
    enum: Object.values(AdsType).filter((v) => typeof v === 'number'),
    default: AdsType.FREE,
  })
  ads_type: AdsType;

  // OPTION == XE CỘ
  @Prop()
  maker: string;

  @Prop()
  maker_alias: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category' })
  makerID: Types.ObjectId;

  @Prop()
  series: string;

  @Prop()
  series_alias: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category' })
  series_id: Types.ObjectId;

  @Prop()
  year: string;

  @Prop()
  km: string;

  @Prop()
  fuel: string;

  @Prop()
  gear: string;

  @Prop()
  seats: number;

  @Prop()
  door: number;

  @Prop()
  color: string;

  @Prop()
  number: string;

  // == BẤT ĐỘNG SẢN
  @Prop()
  acreage: string;

  @Prop()
  bed_num: number;

  @Prop()
  wc_num: number;

  @Prop()
  floor_num: number;

  @Prop()
  num_floor: number;

  @Prop()
  direction: string;
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.index({ userID: 1, createdAt: -1 });
PostSchema.index({ status: 1, createdAt: -1 });
PostSchema.index({ status: 1, price: 1 });

PostSchema.index({ categoryID: 1, status: 1, createdAt: -1 });
PostSchema.index({ cityID: 1, status: 1, createdAt: -1 });
PostSchema.index({ areaID: 1, status: 1, createdAt: -1 });

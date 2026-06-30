import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type PostDocument = HydratedDocument<Post>;

@Schema({ timestamps: true })
export class Post {
  // poster
  @Prop()
  email: string;

  @Prop()
  phone: string;

  @Prop()
  name: string;

  @Prop({ default: 1 })
  user_type: number; // 1: personal | 2: company

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userID: MongooseSchema.Types.ObjectId;

  // post content
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category' })
  categoryID: MongooseSchema.Types.ObjectId;

  @Prop()
  category: string;

  @Prop()
  category_alias: string;

  @Prop({ default: 1 })
  post_type: number; // 1: sale | 2: buy | 3: cho thuê | 4: cần thuê

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
  areaID: MongooseSchema.Types.ObjectId;

  @Prop()
  city: string;

  @Prop()
  city_alias: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'City' })
  cityID: MongooseSchema.Types.ObjectId;

  @Prop()
  address: string;

  @Prop({ default: 1 })
  status: number; // 0: Đang khóa | 1: Chờ duyệt | 2: Đã duyệt(đang đăng) | 3: Đã xong | 4: Đã hủy | 5: Hết hạn(chờ xóa) | 6: Đã xóa

  @Prop({ default: 1 })
  ads_type: number; // 1: FREE | 2: DAY | 3: MONTH

  // OPTION == XE CỘ
  @Prop()
  maker: string;

  @Prop()
  maker_alias: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category' })
  makerID: MongooseSchema.Types.ObjectId;

  @Prop()
  series: string;

  @Prop()
  series_alias: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category' })
  series_id: MongooseSchema.Types.ObjectId;

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

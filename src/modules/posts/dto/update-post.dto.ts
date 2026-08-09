import {
  IsString,
  Length,
  IsInt,
  Min,
  IsEmail,
  IsOptional,
  IsArray,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PostType, UserType } from '../const/post.enum';
import { VALIDATION_MESSAGES } from '../const/posts.const';

export class UpdatePostDto {
  @IsString()
  @IsOptional()
  userID?: string;

  @IsString()
  @IsOptional()
  categoryID?: string;

  @Type(() => Number)
  @IsEnum(PostType)
  @IsOptional()
  post_type?: PostType;

  @IsString()
  @Length(1, 200, { message: VALIDATION_MESSAGES.TITLE_LENGTH })
  @IsOptional()
  title?: string;

  @Type(() => Number)
  @IsInt({ message: VALIDATION_MESSAGES.PRICE_MIN })
  @Min(100, { message: VALIDATION_MESSAGES.PRICE_MIN })
  @IsOptional()
  price?: number;

  @IsEmail({}, { message: VALIDATION_MESSAGES.INVALID_EMAIL })
  @IsOptional()
  user_email?: string;

  @IsString()
  @IsOptional()
  user_phone?: string;

  @IsString()
  @IsOptional()
  user_name?: string;

  @Type(() => Number)
  @IsEnum(UserType)
  @IsOptional()
  user_type?: UserType;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  areaID?: string;

  @IsString()
  @IsOptional()
  cityID?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  image?: string[];

  @IsString()
  @IsOptional()
  address?: string;

  category?: string;
  category_alias?: string;
  area?: string;
  area_alias?: string;
  city?: string;
  city_alias?: string;
  name?: string;
  email?: string;
  phone?: string;
}

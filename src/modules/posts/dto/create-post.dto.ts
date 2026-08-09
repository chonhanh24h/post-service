import {
  IsNotEmpty,
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
import { VALIDATION_MESSAGES } from '../posts.consts';

export class CreatePostDto {
  @IsNotEmpty({ message: VALIDATION_MESSAGES.USER_ID_REQUIRED })
  @IsString()
  userID: string;

  @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED })
  @IsString()
  categoryID: string;

  @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED })
  @Type(() => Number)
  @IsEnum(PostType)
  post_type: PostType;

  @IsString()
  @Length(1, 200, { message: VALIDATION_MESSAGES.TITLE_LENGTH })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED })
  title: string;

  @Type(() => Number)
  @IsInt({ message: VALIDATION_MESSAGES.PRICE_MIN })
  @Min(100, { message: VALIDATION_MESSAGES.PRICE_MIN })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.FIELD_REQUIRED })
  price: number;

  @IsEmail({}, { message: VALIDATION_MESSAGES.INVALID_EMAIL })
  user_email: string;

  @IsString()
  @IsOptional()
  user_phone: string;

  @IsString()
  @IsOptional()
  user_name: string;

  @Type(() => Number)
  @IsOptional()
  @IsEnum(UserType)
  user_type: UserType;

  @IsString()
  @IsOptional()
  content: string;

  @IsString()
  @IsOptional()
  areaID: string;

  @IsString()
  @IsOptional()
  cityID: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  image: string[];

  @IsString()
  @IsOptional()
  address: string;
}

import {
  IsString,
  Length,
  IsInt,
  Min,
  IsEmail,
  IsOptional,
  IsArray,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdatePostDto {
  @IsString()
  @IsOptional()
  userID?: string;

  @IsString()
  @IsOptional()
  categoryID?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  post_type?: number;

  @IsString()
  @Length(1, 200, { message: 'Tiêu đề không vượt quá 200 ký tự' })
  @IsOptional()
  title?: string;

  @Type(() => Number)
  @IsInt({ message: 'Giá của sản phẩm phải là số nguyên dương lớn hơn 100' })
  @Min(100, { message: 'Giá của sản phẩm phải là số nguyên dương lớn hơn 100' })
  @IsOptional()
  price?: number;

  @IsEmail({}, { message: 'Định dạng email không hợp lệ' })
  @IsOptional()
  user_email?: string;

  @IsString()
  @IsOptional()
  user_phone?: string;

  @IsString()
  @IsOptional()
  user_name?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  user_type?: number;

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

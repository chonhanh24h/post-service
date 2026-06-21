import { IsNotEmpty, IsString, Length, IsInt, Min, IsEmail, IsOptional, IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePostDto {
  @IsNotEmpty({ message: 'Vui lòng cung cấp userID!' })
  @IsString()
  userID: string;

  @IsNotEmpty({ message: 'Vui lòng chọn/điền vào thông tin này!' })
  @IsString()
  categoryID: string;

  @IsNotEmpty({ message: 'Vui lòng chọn/điền vào thông tin này!' })
  @Type(() => Number)
  @IsNumber()
  post_type: number;

  @IsString()
  @Length(1, 200, { message: 'Tiêu đề không vượt quá 200 ký tự' })
  @IsNotEmpty({ message: 'Vui lòng chọn/điền vào thông tin này!' })
  title: string;

  @Type(() => Number)
  @IsInt({ message: 'Giá của sản phẩm phải là số nguyên dương lớn hơn 100' })
  @Min(100, { message: 'Giá của sản phẩm phải là số nguyên dương lớn hơn 100' })
  @IsNotEmpty({ message: 'Vui lòng chọn/điền vào thông tin này!' })
  price: number;

  @IsEmail({}, { message: 'Định dạng email không hợp lệ' })
  user_email: string;

  @IsString()
  @IsOptional()
  user_phone: string;

  @IsString()
  @IsOptional()
  user_name: string;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  user_type: number;

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
  post_images: string[];

  @IsString()
  @IsOptional()
  address: string;
}

# Implementation Plan: Create Post API (NestJS)

This document outlines the implementation plan for the "Create Post" functionality, migrating from the existing Express.js controller to a modern NestJS architecture. 

## Technical Changes & Upgrades
- **Framework:** NestJS
- **Storage:** AWS S3 for image uploads
- **Validation:** `class-validator` and `class-transformer` via DTOs.
- **Database:** MongoDB (Mongoose)

---

## API Lifecycle Execution Order

The execution flow will follow the standard NestJS request lifecycle. This ensures clean separation of concerns and maintainability.

### 1. Routing & Controller Layer (`@Controller('posts')`) in api-gateway
- Define the `POST /` endpoint within `PostsController`.
- Bind necessary decorators for guards, interceptors, and body parsing.

### 2. Authentication & Authorization (Guards)
- **`JwtAuthGuard`**: Ensure the user is authenticated before they can post.
- Extracts the user context (JWT payload) and attaches it to `req.user`.

### 3. File Upload Handling (Interceptors)
- **`FilesInterceptor('post_images')`**: Intercept the incoming request to parse `multipart/form-data`.
- Extract image files into memory before the request body hits the validation pipes.
- This allows the controller to receive both the body fields and the files separately.

### 4. Data Validation & Transformation (Pipes & DTOs)
- **`ValidationPipe`**: Automatically validate the incoming request body against a Data Transfer Object.
- **`CreatePostDto`**:
  - Validates core fields: `post_category`, `post_type`, `post_title` (1-200 chars), `post_price` (min 100), `post_content`, `post_agree`.
  - Validates user info: `user_name`, `user_email` (isEmail), `user_phone`, `user_type`.
  - Applies conditional validation based on the category (e.g., Car, Motorbike, Real Estate fields like `car_maker`, `home_acreage`, `motor_year`).
  - Automatically throws a formatted `BadRequestException` if validation fails, replacing the manual `req.assert` and manual error mapping.

### 5. Business Logic (Service Layer)
- **`AwsS3Service`**:
  - Receives the intercepted memory files.
  - Uploads files to an AWS S3 bucket.
  - Returns an array of S3 Object URLs to be saved in the database.
- **`PostsService`**:
  - Prepares the base `dataCreate` object including user info, title, generated alias, price, and default status (2 = Đã duyệt/Chờ duyệt).
  - Determines specific metadata mappings based on `post_category` ID (Cars, Motorbikes, Real Estate).
  - Fetches relational data concurrently using `Promise.all`:
    - Queries `CategoryModel` to get level names and aliases (category, maker, series).
    - Queries `CityModel`/`AreaModel` to get localized names and aliases.
  - Assembles the final post object combining base data, category data, area data, specific metadata, and S3 image URLs.

### 6. Data Access Layer (Repository / Mongoose Model)
- Executes the database operations.
- **Optimization:** Instead of saving a preliminary document and then performing a `bulkWrite` to update it, the complete object is assembled in the Service layer. We will execute a single `PostModel.create()` operation to improve performance and data consistency.

### 7. Response Handling & Exception Filters
- **Success**: Return a standardized JSON response `{ status: true, id: postCreated._id }`.
- **Exception Filters**: Catch `MongoError`, `S3UploadError`, or standard `HttpExceptions` and format them to match the expected client response format (e.g., `{ status: false, type: 3, msg: 'Tin đăng gặp sự cố. Vui lòng thử lại!' }`).

---

## Detailed Component Breakdown

### A. DTOs (Data Transfer Objects)
```typescript
import { IsNotEmpty, IsString, Length, IsInt, Min, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePostDto {
  @IsNotEmpty({ message: 'Vui lòng chọn/điền vào thông tin này!' })
  post_category: string;

  @IsNotEmpty({ message: 'Vui lòng chọn/điền vào thông tin này!' })
  post_type: string;

  @IsString()
  @Length(1, 200, { message: 'Tiêu đề không vượt quá 200 ký tự' })
  @IsNotEmpty({ message: 'Vui lòng chọn/điền vào thông tin này!' })
  post_title: string;

  @Type(() => Number)
  @IsInt({ message: 'Giá của sản phẩm phải là số nguyên dương lớn hơn 100' })
  @Min(100, { message: 'Giá của sản phẩm phải là số nguyên dương lớn hơn 100' })
  @IsNotEmpty({ message: 'Vui lòng chọn/điền vào thông tin này!' })
  post_price: number;

  @IsEmail({}, { message: 'Định dạng email không hợp lệ' })
  user_email: string;

  // ... other fields like car_maker, home_acreage depending on the category
}
```

### B. Controller
```typescript
import { Controller, Post, UseGuards, UseInterceptors, UploadedFiles, Body, Req } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePostDto } from './dto/create-post.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createPost(
    @Req() req: RequestWithUser,
    @Body() createPostDto: CreatePostDto
  ) {
    return this.postsService.createPost(req.user, createPostDto);
  }
}
```

### C. Service Logic Overview (`PostsService.createPost`)
```typescript
async createPost(user: UserEntity, dto: CreatePostDto) {
  // 2. Fetch Category and Area details concurrently
  const [categories, areas] = await Promise.all([
    this.categoryService.findByIds([dto.post_category, ...]),
    this.areaService.findByIds([dto.post_area, dto.post_city]),
  ]);

  // 3. Map specific properties (Car, Motorbike, House)
  const metadata = this.extractMetadata(dto);

  // 4. Assemble final document
  const postData = {
    userID: user._id,
    title: dto.post_title,
    images: imageUrls,
    // ... merge categories, areas, metadata
  };

  // 5. Single database save operation
  const newPost = await this.postModel.create(postData);
  
  // 6. Return presigned URLs so client can perform PUT requests
  return { 
    status: true, 
    id: newPost._id.toString(),
    presignedUrls
  };
}
```

import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { getModelToken } from '@nestjs/mongoose';
import { Post } from './post.schema';
import { BadRequestException } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { CreatePostDto } from './dto/create-post.dto';
import { Types } from 'mongoose';
import { PostStatus } from './const/post.enum';

describe('PostsService', () => {
  let service: PostsService;
  let coreServiceClient: { send: jest.Mock };

  const mockPostModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    save: jest.fn(),
  };

  const mockCoreServiceClient = {
    send: jest.fn(),
  };

  // Create a mock constructor function for the model
  const mockPostModelConstructor = jest
    .fn()
    .mockImplementation((dto: unknown) => ({
      ...(dto as object),
      save: mockPostModel.save,
    }));
  Object.assign(mockPostModelConstructor, mockPostModel);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getModelToken(Post.name),
          useValue: mockPostModelConstructor,
        },
        {
          provide: 'CORE_SERVICE',
          useValue: mockCoreServiceClient,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    coreServiceClient = module.get<{ send: jest.Mock }>('CORE_SERVICE');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of posts', async () => {
      const mockExec = jest.fn().mockResolvedValue(['post1', 'post2']);
      const mockLimit = jest.fn().mockReturnValue({ exec: mockExec });
      const mockSkip = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockSort = jest.fn().mockReturnValue({ skip: mockSkip });
      mockPostModel.find.mockReturnValue({ sort: mockSort });

      const result = await service.findAll({
        page: '1',
        q: 'test',
        sort: 'price_asc',
      });

      expect(mockPostModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          title: { $regex: 'test', $options: 'i' },
          status: PostStatus.APPROVED,
        }),
      );
      expect(mockSort).toHaveBeenCalledWith({ price: 1 });
      expect(mockSkip).toHaveBeenCalledWith(0);
      expect(mockLimit).toHaveBeenCalledWith(20);
      expect(result).toEqual(['post1', 'post2']);
    });
  });

  describe('findOne', () => {
    it('should return a single post', async () => {
      const mockExec = jest.fn().mockResolvedValue('post1');
      mockPostModel.findById.mockReturnValue({ exec: mockExec });

      const result = await service.findOne('123');

      expect(mockPostModel.findById).toHaveBeenCalledWith('123');
      expect(result).toEqual('post1');
    });
  });

  describe('findByUserId', () => {
    it('should return posts for a user', async () => {
      const mockExec = jest.fn().mockResolvedValue(['post1']);
      const mockSort = jest.fn().mockReturnValue({ exec: mockExec });
      mockPostModel.find.mockReturnValue({ sort: mockSort });

      const result = await service.findByUserId('6a51030d2b2b78d3068894a6');

      expect(mockPostModel.find).toHaveBeenCalledWith({
        userID: new Types.ObjectId('6a51030d2b2b78d3068894a6'),
      });
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(result).toEqual(['post1']);
    });
  });

  describe('create', () => {
    it('should throw BadRequestException if category is not provided', async () => {
      await expect(service.create({} as CreatePostDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if category is not found', async () => {
      coreServiceClient.send.mockReturnValue(throwError(() => new Error()));

      await expect(
        service.create({ categoryID: 'cat1' } as CreatePostDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if area is not found', async () => {
      coreServiceClient.send.mockImplementation(({ cmd }: { cmd: string }) => {
        if (cmd === 'get_category_by_id')
          return of({ name: 'cat', alias: 'cat' });
        if (cmd === 'get_city_by_id') return throwError(() => new Error());
      });

      await expect(
        service.create({
          categoryID: 'cat1',
          areaID: 'area1',
        } as CreatePostDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if city is not found', async () => {
      coreServiceClient.send.mockImplementation(
        ({ cmd }: { cmd: string }, id: string) => {
          if (cmd === 'get_category_by_id')
            return of({ name: 'cat', alias: 'cat' });
          if (cmd === 'get_city_by_id' && id === 'city1')
            return throwError(() => new Error());
          if (cmd === 'get_city_by_id' && id === 'area1')
            return of({ name: 'area', alias: 'area' });
        },
      );

      await expect(
        service.create({
          categoryID: 'cat1',
          areaID: 'area1',
          cityID: 'city1',
        } as CreatePostDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully create a post', async () => {
      coreServiceClient.send.mockImplementation(({ cmd }: { cmd: string }) => {
        if (cmd === 'get_category_by_id')
          return of({ name: 'cat', alias: 'cat-alias' });
        if (cmd === 'get_city_by_id')
          return of({ name: 'city', alias: 'city-alias' });
      });
      mockPostModel.save.mockResolvedValue('createdPost');

      const dto: Partial<CreatePostDto> = {
        categoryID: 'cat1',
        areaID: 'area1',
        cityID: 'city1',
        userID: 'user1',
        title: 'test title',
      };

      const result = await service.create(dto as CreatePostDto);

      expect(mockPostModelConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          userID: 'user1',
          categoryID: 'cat1',
          category: 'cat',
          category_alias: 'cat-alias',
          title: 'test title',
          status: PostStatus.APPROVED,
        }),
      );
      expect(result).toEqual('createdPost');
    });
  });

  describe('update', () => {
    it('should update and return the post', async () => {
      const mockExec = jest.fn().mockResolvedValue('updatedPost');
      mockPostModel.findByIdAndUpdate.mockReturnValue({ exec: mockExec });

      const result = await service.update('123', { title: 'new title' });

      expect(mockPostModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '123',
        { title: 'new title' },
        { new: true },
      );
      expect(result).toEqual('updatedPost');
    });
  });

  describe('remove', () => {
    it('should remove the post', async () => {
      const mockExec = jest.fn().mockResolvedValue('removedPost');
      mockPostModel.findByIdAndDelete.mockReturnValue({ exec: mockExec });

      const result = await service.remove('123');

      expect(mockPostModel.findByIdAndDelete).toHaveBeenCalledWith('123');
      expect(result).toEqual('removedPost');
    });
  });
});

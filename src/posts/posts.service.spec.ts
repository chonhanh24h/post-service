import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { getModelToken } from '@nestjs/mongoose';
import { Post } from '../schemas/post.schema';
import { BadRequestException } from '@nestjs/common';
import { of, throwError } from 'rxjs';

describe('PostsService', () => {
  let service: PostsService;
  let model: any;
  let coreServiceClient: any;

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
  const mockPostModelConstructor = jest.fn().mockImplementation((dto) => ({
    ...dto,
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
    model = module.get(getModelToken(Post.name));
    coreServiceClient = module.get('CORE_SERVICE');
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

      expect(mockPostModel.find).toHaveBeenCalledWith({
        title: { $regex: 'test', $options: 'i' },
        status: 2,
      });
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

      const result = await service.findByUserId('user1');

      expect(mockPostModel.find).toHaveBeenCalledWith({ userID: 'user1' });
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(result).toEqual(['post1']);
    });
  });

  describe('create', () => {
    it('should throw BadRequestException if category is not provided', async () => {
      await expect(service.create({} as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if category is not found', async () => {
      coreServiceClient.send.mockReturnValue(throwError(() => new Error()));

      await expect(
        service.create({ categoryID: 'cat1' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if area is not found', async () => {
      coreServiceClient.send.mockImplementation(({ cmd }) => {
        if (cmd === 'get_category_by_id')
          return of({ name: 'cat', alias: 'cat' });
        if (cmd === 'get_city_by_id') return throwError(() => new Error());
      });

      await expect(
        service.create({ categoryID: 'cat1', areaID: 'area1' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if city is not found', async () => {
      coreServiceClient.send.mockImplementation(({ cmd }, id) => {
        if (cmd === 'get_category_by_id')
          return of({ name: 'cat', alias: 'cat' });
        if (cmd === 'get_city_by_id' && id === 'city1')
          return throwError(() => new Error());
        if (cmd === 'get_city_by_id' && id === 'area1')
          return of({ name: 'area', alias: 'area' });
      });

      await expect(
        service.create({
          categoryID: 'cat1',
          areaID: 'area1',
          cityID: 'city1',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully create a post', async () => {
      coreServiceClient.send.mockImplementation(({ cmd }) => {
        if (cmd === 'get_category_by_id')
          return of({ name: 'cat', alias: 'cat-alias' });
        if (cmd === 'get_city_by_id')
          return of({ name: 'city', alias: 'city-alias' });
      });
      mockPostModel.save.mockResolvedValue('createdPost');

      const dto = {
        categoryID: 'cat1',
        areaID: 'area1',
        cityID: 'city1',
        userID: 'user1',
        title: 'test title',
      };

      const result = await service.create(dto as any);

      expect(mockPostModelConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          userID: 'user1',
          categoryID: 'cat1',
          category: 'cat',
          category_alias: 'cat-alias',
          title: 'test title',
          status: 2,
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

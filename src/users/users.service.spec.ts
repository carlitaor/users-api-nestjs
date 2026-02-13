import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken, getConnectionToken } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';
import { Profile } from '../profile/schemas/profile.schema';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock de bcrypt
jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let mockUserModel: any;
  let mockProfileModel: any;
  let mockConnection: any;
  let mockSession: any;

  beforeEach(async () => {
    // Mock del session para transacciones
    mockSession = {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      abortTransaction: jest.fn(),
      endSession: jest.fn(),
    };

    // Mock de los modelos
    mockUserModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    mockProfileModel = {
      create: jest.fn(),
      find: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    mockConnection = {
      startSession: jest.fn().mockResolvedValue(mockSession),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(Profile.name),
          useValue: mockProfileModel,
        },
        {
          provide: getConnectionToken(),
          useValue: mockConnection,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
      profile: {
        firstName: 'John',
        lastName: 'Doe',
      },
    };

    it('debe crear un usuario y perfil exitosamente', async () => {
      const hashedPassword = 'hashedPassword123';
      const mockProfile = { _id: 'profile123', ...createUserDto.profile };
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        username: 'testuser',
        password: hashedPassword,
        profile: mockProfile._id,
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserModel.findOne.mockResolvedValue(null);
      mockProfileModel.create.mockResolvedValue([mockProfile]);
      mockUserModel.create.mockResolvedValue([mockUser]);
      mockProfileModel.findByIdAndUpdate.mockResolvedValue(mockProfile);
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue({
              ...mockUser,
              profile: mockProfile,
            }),
          }),
        }),
      });

      const result = await service.create(createUserDto);

      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
      expect(mockConnection.startSession).toHaveBeenCalled();
      expect(mockSession.startTransaction).toHaveBeenCalled();
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('debe lanzar ConflictException si el email ya existe', async () => {
      mockUserModel.findOne.mockResolvedValueOnce({ email: 'test@example.com' });

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createUserDto)).rejects.toThrow(
        'El email ya está registrado',
      );
    });

    it('debe lanzar ConflictException si el username ya existe', async () => {
      mockUserModel.findOne
        .mockResolvedValueOnce(null) // email no existe
        .mockResolvedValueOnce({ username: 'testuser' }); // username existe

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(createUserDto)).rejects.toThrow(
        'El username ya está registrado',
      );
    });

    it('debe hacer rollback de la transacción si falla', async () => {
      const hashedPassword = 'hashedPassword123';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserModel.findOne.mockResolvedValue(null);
      mockProfileModel.create.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createUserDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('debe normalizar email y username a lowercase', async () => {
      const dtoWithUppercase = {
        ...createUserDto,
        email: 'TEST@EXAMPLE.COM',
        username: 'TESTUSER',
      };

      const hashedPassword = 'hashedPassword123';
      const mockProfile = { _id: 'profile123' };
      const mockUser = { _id: 'user123' };

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserModel.findOne.mockResolvedValue(null);
      mockProfileModel.create.mockResolvedValue([mockProfile]);
      mockUserModel.create.mockResolvedValue([mockUser]);
      mockProfileModel.findByIdAndUpdate.mockResolvedValue(mockProfile);
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue(mockUser),
          }),
        }),
      });

      await service.create(dtoWithUppercase);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        username: 'testuser',
      });
    });
  });

  describe('findAll', () => {
    it('debe retornar usuarios paginados', async () => {
      const mockUsers = [
        { _id: '1', email: 'user1@test.com', username: 'user1' },
        { _id: '2', email: 'user2@test.com', username: 'user2' },
      ];

      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUsers),
      });
      mockUserModel.countDocuments.mockResolvedValue(10);

      const result = await service.findAll(1, 2);

      expect(result.users).toEqual(mockUsers);
      expect(result.total).toBe(10);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(5);
    });

    it('debe filtrar usuarios por búsqueda de texto', async () => {
      const mockProfiles = [{ _id: 'profile1' }];
      const mockUsers = [{ _id: '1', email: 'john@test.com' }];

      mockProfileModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockProfiles),
      });

      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUsers),
      });
      mockUserModel.countDocuments.mockResolvedValue(1);

      await service.findAll(1, 10, 'john');

      expect(mockProfileModel.find).toHaveBeenCalled();
    });

    it('debe ordenar usuarios correctamente', async () => {
      mockUserModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });
      mockUserModel.countDocuments.mockResolvedValue(0);

      await service.findAll(1, 10, undefined, 'email', 'asc');

      const findChain = mockUserModel.find();
      expect(findChain.sort).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('debe retornar un usuario por ID', async () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
      };

      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockUser);
    });

    it('debe lanzar BadRequestException si el ID es inválido', async () => {
      await expect(service.findOne('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.findOne('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('debe retornar un usuario por email', async () => {
      const mockUser = { email: 'test@example.com', username: 'testuser' };

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findByEmail('noexiste@example.com')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe normalizar el email a lowercase', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ email: 'test@example.com' }),
      });

      await service.findByEmail('TEST@EXAMPLE.COM');

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });
  });

  describe('findByEmailOptional', () => {
    it('debe retornar un usuario si existe', async () => {
      const mockUser = { email: 'test@example.com' };

      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.findByEmailOptional('test@example.com');

      expect(result).toEqual(mockUser);
    });

    it('debe retornar null si el usuario no existe', async () => {
      mockUserModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.findByEmailOptional('noexiste@example.com');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const userId = '507f1f77bcf86cd799439011';
    const updateDto = {
      email: 'newemail@example.com',
      username: 'newusername',
    };

    it('debe actualizar un usuario exitosamente', async () => {
      const mockUser = {
        _id: userId,
        email: 'old@example.com',
        username: 'oldusername',
        profile: 'profile123',
      };

      mockUserModel.findById.mockResolvedValueOnce(mockUser);
      mockUserModel.findOne.mockResolvedValue(null); // No conflictos
      mockUserModel.findByIdAndUpdate.mockResolvedValue(mockUser);
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      const result = await service.update(userId, updateDto);

      expect(result).toBeDefined();
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si el ID es inválido', async () => {
      await expect(service.update('invalid-id', updateDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      await expect(service.update(userId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar ConflictException si el nuevo email ya existe', async () => {
      const mockUser = {
        _id: userId,
        email: 'old@example.com',
        username: 'oldusername',
      };

      mockUserModel.findById.mockResolvedValue(mockUser);
      mockUserModel.findOne.mockResolvedValue({ email: 'newemail@example.com' });

      await expect(service.update(userId, updateDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('debe actualizar el perfil si se proporcionan datos', async () => {
      const updateDtoWithProfile = {
        ...updateDto,
        profile: { firstName: 'John', lastName: 'Doe' },
      };

      const mockUser = {
        _id: userId,
        email: 'old@example.com',
        username: 'oldusername',
        profile: 'profile123',
      };

      mockUserModel.findById.mockResolvedValueOnce(mockUser);
      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.findByIdAndUpdate.mockResolvedValue(mockUser);
      mockProfileModel.findByIdAndUpdate.mockResolvedValue({});
      mockUserModel.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockUser),
      });

      await service.update(userId, updateDtoWithProfile);

      expect(mockProfileModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'profile123',
        { $set: updateDtoWithProfile.profile },
        { new: true, runValidators: true },
      );
    });
  });

  describe('updateProfile', () => {
    const userId = '507f1f77bcf86cd799439011';
    const updateProfileDto = {
      firstName: 'Jane',
      lastName: 'Smith',
    };

    it('debe actualizar el perfil exitosamente', async () => {
      const mockUser = { _id: userId, profile: 'profile123' };
      const mockProfile = { _id: 'profile123', ...updateProfileDto };

      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUser),
      });
      mockProfileModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProfile),
      });

      const result = await service.updateProfile(userId, updateProfileDto);

      expect(result).toEqual(mockProfile);
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      mockUserModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.updateProfile(userId, updateProfileDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    const userId = '507f1f77bcf86cd799439011';

    it('debe eliminar un usuario y su perfil', async () => {
      const mockUser = {
        _id: userId,
        email: 'test@example.com',
        profile: 'profile123',
      };

      mockUserModel.findById.mockResolvedValue(mockUser);
      mockUserModel.findByIdAndDelete.mockResolvedValue(mockUser);
      mockProfileModel.findByIdAndDelete.mockResolvedValue({});

      const result = await service.remove(userId);

      expect(result).toEqual({
        message: 'Usuario eliminado exitosamente',
        id: userId,
      });
      expect(mockUserModel.findByIdAndDelete).toHaveBeenCalledWith(userId);
      expect(mockProfileModel.findByIdAndDelete).toHaveBeenCalledWith(
        'profile123',
      );
    });

    it('debe lanzar BadRequestException si el ID es inválido', async () => {
      await expect(service.remove('invalid-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      await expect(service.remove(userId)).rejects.toThrow(NotFoundException);
    });
  });
});
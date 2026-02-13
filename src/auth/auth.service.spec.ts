import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let usersService: UsersService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let jwtService: JwtService;

  const mockUsersService = {
    findByEmailOptional: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    const createUserDto = {
      email: 'newuser@example.com',
      username: 'newuser',
      password: 'password123',
      profile: {
        firstName: 'John',
        lastName: 'Doe',
      },
    };

    it('debe registrar un nuevo usuario exitosamente', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'hashedPassword',
        profile: { firstName: 'John', lastName: 'Doe' },
        toObject: jest.fn().mockReturnValue({
          _id: 'user123',
          email: 'newuser@example.com',
          username: 'newuser',
          password: 'hashedPassword',
          profile: { firstName: 'John', lastName: 'Doe' },
        }),
      };

      const mockToken = 'jwt-token-123';

      mockUsersService.findByEmailOptional.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.signUp(createUserDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('message');
      expect(result.token).toBe(mockToken);
      expect(result.user).not.toHaveProperty('password');
      expect(result.message).toBe('Usuario registrado exitosamente');
      expect(mockUsersService.findByEmailOptional).toHaveBeenCalledWith(
        createUserDto.email,
      );
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
    });

    it('debe lanzar UnauthorizedException si el usuario ya existe', async () => {
      const existingUser = {
        email: 'newuser@example.com',
        username: 'newuser',
      };

      mockUsersService.findByEmailOptional.mockResolvedValue(existingUser);

      await expect(service.signUp(createUserDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.signUp(createUserDto)).rejects.toThrow(
        'El usuario ya existe',
      );
      expect(mockUsersService.create).not.toHaveBeenCalled();
    });

    it('debe generar un token JWT válido', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'newuser@example.com',
        toObject: jest.fn().mockReturnValue({
          _id: 'user123',
          email: 'newuser@example.com',
          password: 'hashedPassword',
        }),
      };

      mockUsersService.findByEmailOptional.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('token');

      await service.signUp(createUserDto);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user123',
        email: 'newuser@example.com',
      });
    });

    it('no debe incluir la contraseña en la respuesta', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'newuser@example.com',
        password: 'hashedPassword',
        username: 'newuser',
        toObject: jest.fn().mockReturnValue({
          _id: 'user123',
          email: 'newuser@example.com',
          password: 'hashedPassword',
          username: 'newuser',
        }),
      };

      mockUsersService.findByEmailOptional.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('token');

      const result = await service.signUp(createUserDto);

      expect(result.user).not.toHaveProperty('password');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('username');
    });
  });

  describe('signIn', () => {
    const loginDto = {
      email: 'user@example.com',
      password: 'password123',
    };

    it('debe iniciar sesión exitosamente con credenciales válidas', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'user@example.com',
        password: 'hashedPassword',
        username: 'testuser',
        toObject: jest.fn().mockReturnValue({
          _id: 'user123',
          email: 'user@example.com',
          password: 'hashedPassword',
          username: 'testuser',
        }),
      };

      const mockToken = 'jwt-token-123';

      mockUsersService.findByEmailOptional.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.signIn(loginDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('message');
      expect(result.token).toBe(mockToken);
      expect(result.user).not.toHaveProperty('password');
      expect(result.message).toBe('Sesión iniciada exitosamente');
    });

    it('debe lanzar UnauthorizedException si el usuario no existe', async () => {
      mockUsersService.findByEmailOptional.mockResolvedValue(null);

      await expect(service.signIn(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.signIn(loginDto)).rejects.toThrow(
        'Credenciales inválidas',
      );
    });

    it('debe lanzar UnauthorizedException si la contraseña es incorrecta', async () => {
      const mockUser = {
        email: 'user@example.com',
        password: 'hashedPassword',
      };

      mockUsersService.findByEmailOptional.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.signIn(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.signIn(loginDto)).rejects.toThrow(
        'Credenciales inválidas',
      );
    });

    it('debe verificar la contraseña usando bcrypt.compare', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'user@example.com',
        password: 'hashedPassword',
        toObject: jest.fn().mockReturnValue({
          _id: 'user123',
          email: 'user@example.com',
          password: 'hashedPassword',
        }),
      };

      mockUsersService.findByEmailOptional.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('token');

      await service.signIn(loginDto);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashedPassword',
      );
    });

    it('debe generar un token JWT con el payload correcto', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'user@example.com',
        password: 'hashedPassword',
        toObject: jest.fn().mockReturnValue({
          _id: 'user123',
          email: 'user@example.com',
          password: 'hashedPassword',
        }),
      };

      mockUsersService.findByEmailOptional.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('token');

      await service.signIn(loginDto);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user123',
        email: 'user@example.com',
      });
    });

    it('no debe incluir la contraseña en la respuesta', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'user@example.com',
        password: 'hashedPassword',
        username: 'testuser',
        toObject: jest.fn().mockReturnValue({
          _id: 'user123',
          email: 'user@example.com',
          password: 'hashedPassword',
          username: 'testuser',
        }),
      };

      mockUsersService.findByEmailOptional.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('token');

      const result = await service.signIn(loginDto);

      expect(result.user).not.toHaveProperty('password');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('username');
    });
  });
});

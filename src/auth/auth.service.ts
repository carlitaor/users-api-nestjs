import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/schemas/user.schema';
import { Document } from 'mongoose';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signUp(createUserDto: CreateUserDto) {
    // Verificar si el usuario ya existe
    const existingUser = await this.usersService.findByEmailOptional(
      createUserDto.email,
    );
    if (existingUser) {
      throw new BadRequestException('El usuario ya existe');
    }

    // Crear el usuario
    const user = (await this.usersService.create(createUserDto)) as User &
      Document;

    // Generar token
    const token = this.generateToken(
      user._id.toString(),
      user.email,
      user.role,
    );

    // Devolver sin la password
    const userObject = user.toObject() as Omit<User, 'password'> & {
      password: string;
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = userObject;

    return {
      user: userWithoutPassword,
      token,
      message: 'Usuario registrado exitosamente',
    };
  }

  async signIn(loginDto: LoginDto) {
    // Buscar el usuario por email
    const user = (await this.usersService.findByEmail(loginDto.email)) as User &
      Document;

    // Comparar la password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Credenciales inválidas');
    }

    // Generar token
    const token = this.generateToken(
      user._id.toString(),
      user.email,
      user.role,
    );

    // Devolver sin la password
    const userObject = user.toObject() as Omit<User, 'password'> & {
      password: string;
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = userObject;

    return {
      user: userWithoutPassword,
      token,
      message: 'Sesión iniciada exitosamente',
    };
  }

  private generateToken(userId: string, email: string, role: string) {
    const payload = {
      sub: userId,
      email,
      role,
    };
    return this.jwtService.sign(payload);
  }
}

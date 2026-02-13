import { Injectable, UnauthorizedException } from '@nestjs/common';
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
    const existingUser = await this.usersService.findByEmailOptional(
      createUserDto.email,
    );
    if (existingUser) {
      throw new UnauthorizedException('El usuario ya existe');
    }

    // Crear el usuario
    const user = (await this.usersService.create(createUserDto)) as User &
      Document;

    // Generar token
    const token = this.generateToken(user._id.toString(), user.email);

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
    const user = await this.usersService.findByEmailOptional(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Generar token
    const token = this.generateToken(
      (user as User & Document)._id.toString(),
      user.email,
    );

    // Devolver sin la password
    const userObject = (user as User & Document).toObject() as Omit<
      User,
      'password'
    > & {
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

  private generateToken(userId: string, email: string) {
    const payload = {
      sub: userId,
      email,
    };
    return this.jwtService.sign(payload);
  }
}

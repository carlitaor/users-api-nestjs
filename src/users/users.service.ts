import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto) {
    // email único
    const existingEmail = await this.userModel.findOne({
      email: createUserDto.email,
    });
    if (existingEmail) {
      throw new ConflictException('El email ya está registrado');
    }

    // username único
    const existingUsername = await this.userModel.findOne({
      username: createUserDto.username,
    });
    if (existingUsername) {
      throw new ConflictException('El username ya está en uso');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // usuario + perfil embebido
    const user = new this.userModel({
      email: createUserDto.email,
      password: hashedPassword,
      username: createUserDto.username,
      role: createUserDto.role,
      profile: createUserDto.profile,
    });

    const savedUser = await user.save();

    // return sin la contraseña
    return this.userModel.findById(savedUser._id).select('-password').exec();
  }

  async findAll(queryDto: QueryUsersDto) {
    const {
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryDto;

    //filtro de búsqueda
    let filter: any = {};

    if (search) {
      filter = {
        $or: [
          { email: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } },
          { 'profile.name': { $regex: search, $options: 'i' } },
          { 'profile.bio': { $regex: search, $options: 'i' } },
        ],
      };
    }

    // skip para paginación
    const skip = (page - 1) * limit;

    // orden
    const sortOrderNum = sortOrder === 'asc' ? 1 : -1;
    const sortObject: any = { [sortBy]: sortOrderNum };

    // consulta
    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-password')
        .sort(sortObject)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID inválido');
    }

    const user = await this.userModel.findById(id).select('-password').exec();

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email }).exec();

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID inválido');
    }

    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // email único
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingEmail = await this.userModel.findOne({
        email: updateUserDto.email,
        _id: { $ne: id },
      });
      if (existingEmail) {
        throw new ConflictException('El email ya está registrado');
      }
    }

    // username único
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUsername = await this.userModel.findOne({
        username: updateUserDto.username,
        _id: { $ne: id },
      });
      if (existingUsername) {
        throw new ConflictException('El username ya está en uso');
      }
    }

    const updateData: Partial<UpdateUserDto> = { ...updateUserDto };

    // perfil embebido
    if (updateUserDto.profile && user.profile) {
      updateData.profile = {
        name: updateUserDto.profile.name ?? user.profile.name,
        bio: updateUserDto.profile.bio ?? user.profile.bio,
      };
    }

    // actualizacion
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .select('-password')
      .exec();

    return updatedUser;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { profile: updateProfileDto } },
      { new: true },
    );

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user.profile;
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID inválido');
    }

    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    // eliminar usuario (perfil embebido se elimina automáticamente)
    await this.userModel.findByIdAndDelete(id);

    return {
      message: 'Usuario eliminado exitosamente',
      id,
    };
  }
}

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
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const normalizedEmail = createUserDto.email?.trim().toLowerCase();
    const normalizedUsername = createUserDto.username?.trim().toLowerCase();
    // email único
    const existingEmail = await this.userModel.findOne({
      email: normalizedEmail,
    });
    if (existingEmail) {
      throw new ConflictException('El email ya está registrado');
    }

    // username único
    const existingUsername = await this.userModel.findOne({
      username: normalizedUsername,
    });
    if (existingUsername) {
      throw new ConflictException('El username ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // usuario + perfil embebido
    const createdUser = new this.userModel({
      ...createUserDto,
      email: normalizedEmail,
      username: normalizedUsername,
      password: hashedPassword,
    });
    return createdUser.save();
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<{
    users: User[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    // Función para escapar caracteres especiales de regex
    const escapeRegex = (text: string): string => {
      return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    interface MongoFilter {
      $or?: Array<{
        email?: { $regex: string; $options: string };
        username?: { $regex: string; $options: string };
        'profile.name'?: { $regex: string; $options: string };
        'profile.bio'?: { $regex: string; $options: string };
      }>;
    }

    const filter: MongoFilter = {};
    if (search) {
      const escapedSearch = escapeRegex(search.trim());
      filter.$or = [
        { email: { $regex: escapedSearch, $options: 'i' } },
        { username: { $regex: escapedSearch, $options: 'i' } },
        { 'profile.name': { $regex: escapedSearch, $options: 'i' } },
        { 'profile.bio': { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    // orden
    const sortOrderNum = sortOrder === 'asc' ? 1 : -1;
    const sortField =
      sortBy === 'name' ? 'profile.name' : sortBy || 'createdAt';
    const sortObject: Record<string, 1 | -1> = {};
    sortObject[sortField] = sortOrderNum;

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
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
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

    if (updateUserDto.email) {
      updateUserDto.email = updateUserDto.email.trim().toLowerCase();
      // email único
      if (updateUserDto.email !== user.email) {
        const existingEmail = await this.userModel.findOne({
          email: updateUserDto.email,
          _id: { $ne: id },
        });
        if (existingEmail) {
          throw new ConflictException('El email ya está registrado');
        }
      }
    }

    // username único
    if (updateUserDto.username) {
      updateUserDto.username = updateUserDto.username.trim().toLowerCase();
      if (updateUserDto.username !== user.username) {
        const existingUsername = await this.userModel.findOne({
          username: updateUserDto.username,
          _id: { $ne: id },
        });
        if (existingUsername) {
          throw new ConflictException('El username ya está en uso');
        }
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
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID inválido');
    }

    const existingUser = await this.userModel.findById(userId).exec();
    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado');
    }
    const currentProfile = existingUser.profile || {};
    const mergedProfile = {
      name: updateProfileDto.name ?? currentProfile.name,
      bio: updateProfileDto.bio ?? currentProfile.bio,
    };
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: { profile: mergedProfile } },
        { new: true, runValidators: true },
      )
      .exec();
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

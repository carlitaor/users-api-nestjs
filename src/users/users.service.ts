import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { Profile, ProfileDocument } from '../profile/schemas/profile.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from '../profile/dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const normalizedEmail = createUserDto.email?.trim().toLowerCase();
    const normalizedUsername = createUserDto.username?.trim().toLowerCase();

    const existingEmail = await this.userModel.findOne({
      email: normalizedEmail,
    });
    if (existingEmail)
      throw new ConflictException('El email ya está registrado');

    const existingUsername = await this.userModel.findOne({
      username: normalizedUsername,
    });
    if (existingUsername)
      throw new ConflictException('El username ya está registrado');

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // 1. Crear el perfil con los datos que vienen en createUserDto.profile
    const createdProfile = await this.profileModel.create(
      createUserDto.profile,
    );

    // 2. Crear el usuario con referencia al perfil
    const createdUser = await this.userModel.create({
      email: normalizedEmail,
      username: normalizedUsername,
      password: hashedPassword,
      role: createUserDto.role,
      profile: createdProfile._id,
    });

    // 3. Guardar referencia inversa en el perfil
    await this.profileModel.findByIdAndUpdate(createdProfile._id, {
      user: createdUser._id,
    });

    const user = await this.userModel
      .findById(createdUser._id)
      .select('-password')
      .populate('profile')
      .exec();

    if (!user) {
      throw new NotFoundException('Error al recuperar el usuario creado');
    }

    return user;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    const skip = (page - 1) * limit;

    const escapeRegex = (text: string): string =>
      text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const filter: Record<string, any> = {};
    if (search) {
      const escapedSearch = escapeRegex(search.trim());

      // perfiles que coincidan
      const matchingProfiles = await this.profileModel
        .find({
          $or: [
            { firstName: { $regex: escapedSearch, $options: 'i' } },
            { lastName: { $regex: escapedSearch, $options: 'i' } },
            { bio: { $regex: escapedSearch, $options: 'i' } },
          ],
        })
        .select('_id')
        .exec();

      const profileIds = matchingProfiles.map((p) => p._id);

      filter.$or = [
        { email: { $regex: escapedSearch, $options: 'i' } },
        { username: { $regex: escapedSearch, $options: 'i' } },
        { profile: { $in: profileIds } },
      ];
    }

    const sortOrderNum = sortOrder === 'asc' ? 1 : -1;
    const sortField = sortBy || 'createdAt';
    const sortObject: Record<string, 1 | -1> = { [sortField]: sortOrderNum };

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-password')
        .populate('profile')
        .sort(sortObject)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter),
    ]);

    return { users, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('ID inválido');

    const user = await this.userModel
      .findById(id)
      .select('-password')
      .populate('profile')
      .exec();

    if (!user)
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);

    return user;
  }

  async findByEmail(email: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async findByEmailOptional(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('ID inválido');

    const user = await this.userModel.findById(id);
    if (!user)
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);

    if (updateUserDto.email) {
      updateUserDto.email = updateUserDto.email.trim().toLowerCase();
      if (updateUserDto.email !== user.email) {
        const existingEmail = await this.userModel.findOne({
          email: updateUserDto.email,
          _id: { $ne: id },
        });
        if (existingEmail)
          throw new ConflictException('El email ya está registrado');
      }
    }

    if (updateUserDto.username) {
      updateUserDto.username = updateUserDto.username.trim().toLowerCase();
      if (updateUserDto.username !== user.username) {
        const existingUsername = await this.userModel.findOne({
          username: updateUserDto.username,
          _id: { $ne: id },
        });
        if (existingUsername)
          throw new ConflictException('El username ya está en uso');
      }
    }

    // Separás los datos del perfil del resto del DTO
    const { profile: profileData, ...userFields } = updateUserDto;

    // Actualizar datos del usuario (email, username, role)
    await this.userModel.findByIdAndUpdate(id, userFields, { new: true });

    // Actualizar perfil en su colección si vienen datos de perfil
    if (profileData && user.profile) {
      await this.profileModel.findByIdAndUpdate(
        user.profile,
        { $set: profileData },
        { new: true, runValidators: true },
      );
    }

    // Retornar usuario con perfil actualizado
    return this.userModel
      .findById(id)
      .select('-password')
      .populate('profile')
      .exec();
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    if (!Types.ObjectId.isValid(userId))
      throw new BadRequestException('ID inválido');

    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const updatedProfile = await this.profileModel
      .findByIdAndUpdate(
        user.profile,
        { $set: updateProfileDto },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updatedProfile) throw new NotFoundException('Perfil no encontrado');

    return updatedProfile;
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('ID inválido');

    const user = await this.userModel.findById(id);
    if (!user)
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);

    await Promise.all([
      this.userModel.findByIdAndDelete(id),
      this.profileModel.findByIdAndDelete(user.profile),
    ]);

    return { message: 'Usuario eliminado exitosamente', id };
  }
}

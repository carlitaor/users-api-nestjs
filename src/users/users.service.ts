import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { Profile, ProfileDocument } from '../profile/schemas/profile.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from '../profile/dto/update-profile.dto';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { QueryUsersDto } from './dto/query-users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
    @InjectConnection() private connection: Connection,
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

    // Transacción de MongoDB para garantizar atomicidad: si falla la creación del usuario
    // después de crear el perfil, se revierte todo. Esto previene datos huérfanos
    // (perfiles sin usuario asociado). Requiere MongoDB con Replica Set configurado.
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      // Crear el perfil primero porque el usuario necesita la referencia al perfil.
      // Se usa create() con array y session para que forme parte de la transacción.
      const [createdProfile] = await this.profileModel.create(
        [createUserDto.profile],
        { session },
      );

      //Crear el usuario con la referencia al perfil recién creado.
      const [createdUser] = await this.userModel.create(
        [
          {
            email: normalizedEmail,
            username: normalizedUsername,
            password: hashedPassword,
            profile: createdProfile._id,
          },
        ],
        { session },
      );

      // Referencia inversa - guardar el ID del usuario en el perfil.
      // Permite navegar la relación bidireccional (User -> Profile y Profile -> User).
      await this.profileModel.findByIdAndUpdate(
        createdProfile._id,
        { user: createdUser._id },
        { session },
      );

      await session.commitTransaction();

      // Se excluye el campo password con select('-password') por seguridad.
      const user = await this.userModel
        .findById(createdUser._id)
        .select('-password')
        .populate('profile')
        .exec();

      if (!user) {
        throw new NotFoundException('Error al recuperar el usuario creado');
      }

      return user;
    } catch (error) {
      // Rollback automático: si cualquier operación dentro del try falla,
      // se aborta la transacción y se revierten todos los cambios.
      await session.abortTransaction();

      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Error al crear el usuario y perfil',
      );
    } finally {
      // Cerrar la sesión, independientemente del resultado,
      // para liberar recursos del connection pool de MongoDB.
      session.endSession();
    }
  }

  async findAll(query: QueryUsersDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    const escapeRegex = (text: string): string =>
      text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const filter: Record<string, any> = {};
    if (search) {
      const escapedSearch = escapeRegex(search.trim());

      // Estrategia de búsqueda porque User y Profile están en colecciones separadas:
      // 1. Buscar perfiles que coincidan con el término (firstName, lastName, bio)
      // 2. Incluir los IDs de esos perfiles en el filtro de usuarios
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
    const normalizedEmail = email?.trim().toLowerCase();
    const user = await this.userModel
      .findOne({ email: normalizedEmail })
      .exec();
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async findByEmailOptional(email: string) {
    const normalizedEmail = email?.trim().toLowerCase();
    return this.userModel.findOne({ email: normalizedEmail }).exec();
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

    // Desestructuración para separar datos para actualizar User y Profile de forma independiente

    const { profile: profileData, ...userFields } = updateUserDto;

    await this.userModel.findByIdAndUpdate(id, userFields, { new: true });

    if (profileData && user.profile) {
      await this.profileModel.findByIdAndUpdate(
        user.profile,
        { $set: profileData },
        { new: true, runValidators: true },
      );
    }

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

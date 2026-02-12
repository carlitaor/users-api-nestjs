import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Profile, ProfileDocument } from './schemas/profile.schema';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
  ) {}

  async create(createProfileDto: CreateProfileDto): Promise<Profile> {
    const createdProfile = new this.profileModel(createProfileDto);
    return createdProfile.save();
  }

  async findAll(): Promise<Profile[]> {
    return this.profileModel.find().exec();
  }

  async findOne(id: string): Promise<Profile> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID inválido');
    }

    const profile = await this.profileModel.findById(id).exec();

    if (!profile) {
      throw new NotFoundException(`Perfil con ID ${id} no encontrado`);
    }

    return profile;
  }

  async update(
    id: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<Profile> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID inválido');
    }

    const updatedProfile = await this.profileModel
      .findByIdAndUpdate(id, updateProfileDto, { new: true })
      .exec();

    if (!updatedProfile) {
      throw new NotFoundException(`Perfil con ID ${id} no encontrado`);
    }

    return updatedProfile;
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID inválido');
    }

    const profile = await this.profileModel.findById(id);
    if (!profile) {
      throw new NotFoundException(`Perfil con ID ${id} no encontrado`);
    }

    await this.profileModel.findByIdAndDelete(id);

    return {
      message: 'Perfil eliminado exitosamente',
      id,
    };
  }
}

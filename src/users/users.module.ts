import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, UserSchema } from './schemas/user.schema';
import { Profile, ProfileSchema } from '../profile/schemas/profile.schema';

@Module({
  imports: [
    // Se registran ambos modelos (User y Profile) en UsersModule porque
    // UsersService necesita operar sobre ambas colecciones (crear perfil junto con usuario,
    // eliminar perfil al eliminar usuario, buscar perfiles por texto, etc.).
    // Esto mantiene la cohesión: toda la lógica de gestión de usuarios está en un solo módulo.
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Profile.name, schema: ProfileSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

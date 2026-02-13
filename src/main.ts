import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging-interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalInterceptors(new LoggingInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Users API')
    .setDescription(
      `## API RESTful para gestión de usuarios y perfiles con autenticación JWT.

### 🔐 Autenticación
1. Registra un usuario en **POST /auth/signup**
2. Inicia sesión en **POST /auth/signin** para obtener un token JWT
3. Haz clic en el botón **"Authorize"** (🔓) arriba y pega el token
4. Ahora puedes acceder a los endpoints protegidos de **/users**

### 📋 Flujo de prueba sugerido
1. \`POST /auth/signup\` → Crear cuenta
2. \`POST /auth/signin\` → Obtener token
3. Authorize con el token
4. \`GET /users\` → Listar usuarios
5. \`GET /users/:id\` → Ver detalle
6. \`PATCH /users/:id\` → Actualizar
7. \`DELETE /users/:id\` → Eliminar`,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa tu token JWT obtenido en /auth/signin',
        in: 'header',
      },
      'access-token',
    )
    .addTag('Auth', 'Endpoints de autenticación (registro e inicio de sesión)')
    .addTag('Users', 'CRUD de usuarios (requiere autenticación JWT)')
    .addTag('Profiles', 'Gestión de perfiles')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Aplicación corriendo: http://localhost:${port}`);
  console.log(`Documentación Swagger: http://localhost:${port}/api`);
}

bootstrap().catch((error) => {
  console.error('Error iniciando la aplicación:', error);
  process.exit(1);
});

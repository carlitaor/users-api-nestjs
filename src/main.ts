import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging-interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  // Filtro global de excepciones: centraliza el manejo de errores en un único punto,
  // garantizando un formato de respuesta consistente (statusCode, timestamp, path, method, error, message)
  // para cualquier tipo de excepción (HTTP, Mongoose, errores inesperados).
  app.useGlobalFilters(new AllExceptionsFilter());

  // Interceptor global de logging: registra método HTTP, URL, status code y tiempo de respuesta
  // de cada petición. Facilita el debugging y monitoreo sin depender de herramientas externas.
  app.useGlobalInterceptors(new LoggingInterceptor());

  // ValidationPipe global con tres opciones clave:
  // - whitelist: elimina automáticamente propiedades no decoradas en los DTOs (previene inyección de campos no esperados)
  // - forbidNonWhitelisted: rechaza la petición si se envían campos no definidos en el DTO (seguridad adicional)
  // - transform: convierte automáticamente los payloads a instancias de los DTOs y transforma tipos (ej: string a number en query params)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configuración de Swagger/OpenAPI para documentación interactiva.
  // Se incluye autenticación Bearer JWT para poder probar endpoints protegidos directamente desde la UI.
  // El identificador 'access-token' se referencia en los controladores con @ApiBearerAuth('access-token').
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

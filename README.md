# Users API - NestJS

API RESTful para gestión de usuarios y perfiles con autenticación JWT.

## 🚀 Características

- ✅ CRUD completo de usuarios y perfiles
- ✅ Autenticación con JWT
- ✅ Paginación, filtros y ordenamiento
- ✅ Validaciones con class-validator
- ✅ Documentación con Swagger
- ✅ Manejo global de errores
- ✅ MongoDB con Mongoose
- ✅ Docker y Docker Compose

## 📋 Requisitos Previos

- Node.js 18+
- Docker y Docker Compose
- npm o yarn

## 🔧 Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/carlitaor/users-api-nestjs.git
cd users-api-nestjs
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```

4. Iniciar MongoDB con Docker:
```bash
docker-compose up -d
```

5. Ejecutar la aplicación:
```bash
npm run start:dev
```

## 📚 Documentación API

Una vez iniciada la aplicación, accede a:
- **Swagger UI**: http://localhost:3000/api
- **Aplicación**: http://localhost:3000

## 🧪 Pruebas

```bash
# Tests unitarios
npm run test

# Tests e2e
npm run test:e2e

# Cobertura
npm run test:cov
```

## 🐳 Docker

```bash
# Construir imagen
docker build -t users-api .

# Ejecutar contenedor
docker run -p 3000:3000 users-api
```

## 📁 Estructura del Proyecto

```
src/
├── auth/           # Módulo de autenticación
├── users/          # Módulo de usuarios
├── profile/        # Módulo de perfiles
├── common/         # Filtros, interceptores, decoradores
└── main.ts         # Punto de entrada
```

## 🔐 Endpoints Principales

### Autenticación
- `POST /auth/signup` - Registrar usuario
- `POST /auth/signin` - Iniciar sesión

### Usuarios
- `GET /users` - Listar usuarios (con paginación)
- `GET /users/:id` - Obtener usuario
- `POST /users` - Crear usuario
- `PATCH /users/:id` - Actualizar usuario
- `DELETE /users/:id` - Eliminar usuario

## 🛠️ Tecnologías

- NestJS 11
- MongoDB + Mongoose
- JWT + Passport
- Swagger/OpenAPI
- TypeScript
- Docker

## 👤 Autor

Carla - [GitHub](https://github.com/carlitaor)
# Users API - NestJS

API RESTful para gestión de usuarios y perfiles con autenticación JWT.

## 🚀 Características

- ✅ CRUD completo de usuarios y perfiles
- ✅ Autenticación con JWT
- ✅ Paginación, filtros y ordenamiento
- ✅ Validaciones con class-validator
- ✅ Documentación con Swagger
- ✅ Manejo global de errores
- ✅ MongoDB con Mongoose y Replica Set
- ✅ Docker y Docker Compose
- ✅ Dockerfile multi-stage (build + producción)
- ✅ Healthcheck automático

## 🛠️ Tecnologías

- NestJS 11
- MongoDB + Mongoose
- JWT + Passport
- Swagger/OpenAPI
- TypeScript
- Docker

---

## 📋 Requisitos Previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo
- [Git](https://git-scm.com/)
- (Opcional) [MongoDB Compass](https://www.mongodb.com/products/compass) para visualizar la base de datos

> ⚠️ **No necesitás tener Node.js ni MongoDB instalados localmente.** Todo corre dentro de los contenedores Docker.

---

## 🔧 Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/carlitaor/users-api-nestjs.git
cd users-api-nestjs
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

El archivo `.env` debe contener:

```env
MONGODB_URI=mongodb://mongodb:27017/users-api?replicaSet=rs0
JWT_SECRET=tu_clave_secreta_aqui
JWT_EXPIRATION=1d
PORT=3000
NODE_ENV=production
```

### 3. Levantar todos los servicios

```bash
docker-compose up -d --build
```

Esto levanta automáticamente 3 contenedores:

| Servicio | Descripción | Puerto |
|----------|-------------|--------|
| **users-api** | API REST NestJS | `3000` |
| **mongodb** | Base de datos MongoDB con Replica Set | `27017` |
| **mongo-express** | Panel web para administrar la DB | `8081` |

### 4. Verificar que todo esté corriendo

```bash
docker-compose ps
```

Esperá a que `users-api` y `mongodb` aparezcan con estado **`Up (healthy)`**. Puede tardar hasta 1 minuto mientras MongoDB inicializa el Replica Set.

### 5. Ver los logs (opcional)

```bash
# Todos los servicios
docker-compose logs -f

# Solo la API
docker-compose logs -f users-api
```

> Para salir de los logs presioná `Ctrl + C` (no detiene los contenedores).

---

## 🌐 Acceder a la aplicación

Una vez que los contenedores estén `healthy`:

| Recurso | URL | Descripción |
|---------|-----|-------------|
| 🚀 **API REST** | http://localhost:3000 | Endpoint principal de la API |
| 📖 **Swagger UI** | http://localhost:3000/api | Documentación interactiva - podés probar todos los endpoints desde el navegador |
| 🗄️ **Mongo Express** | http://localhost:8081 | Panel visual para administrar la base de datos MongoDB |

### 🔌 Conectar MongoDB Compass (opcional)

Si tenés [MongoDB Compass](https://www.mongodb.com/products/compass) instalado, conectate con:

```
mongodb://localhost:27017/?directConnection=true
```

> ⚠️ Si tenés MongoDB instalado localmente, puede haber conflicto en el puerto `27017`. Detené el servicio local con `net stop MongoDB` (Windows) antes de conectar.

---

## 📖 Uso de la API

### Flujo de autenticación

#### 1. Registrar un usuario

```bash
curl -X POST http://localhost:3000/auth/signup ^
  -H "Content-Type: application/json" ^
  -d "{\"name\": \"Juan Perez\", \"email\": \"juan@example.com\", \"password\": \"Password123!\"}"
```

#### 2. Iniciar sesión (obtener token JWT)

```bash
curl -X POST http://localhost:3000/auth/signin ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"juan@example.com\", \"password\": \"Password123!\"}"
```

Respuesta:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 3. Usar endpoints protegidos

Incluí el token en el header `Authorization`:

```bash
curl -X GET http://localhost:3000/users ^
  -H "Authorization: Bearer <tu_token_aqui>"
```

> 💡 **Tip**: Es más fácil probar todo desde [Swagger UI](http://localhost:3000/api). Hacé clic en el botón **Authorize** 🔒 y pegá tu token.

---

## 🔐 Endpoints

### Autenticación (públicos)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/auth/signup` | Registrar usuario |
| `POST` | `/auth/signin` | Iniciar sesión |

### Usuarios (requieren JWT 🔒)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/users` | Listar usuarios (con paginación) |
| `GET` | `/users/:id` | Obtener usuario por ID |
| `POST` | `/users` | Crear usuario |
| `PATCH` | `/users/:id` | Actualizar usuario |
| `DELETE` | `/users/:id` | Eliminar usuario |

---

## 🧪 Pruebas

```bash
# Tests unitarios
npm run test

# Tests e2e
npm run test:e2e

# Cobertura
npm run test:cov
```

---

## 🐳 Comandos Docker útiles

```bash
# Levantar los contenedores
docker-compose up -d --build

# Ver estado de los contenedores
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Detener los contenedores
docker-compose down

# Detener y eliminar la base de datos (reset completo)
docker-compose down -v

# Reconstruir solo la API después de cambios en el código
docker-compose up -d --build users-api
```

---

## 📁 Estructura del Proyecto

```
users-api-nestjs/
├── src/
│   ├── auth/              # Módulo de autenticación (signup, signin, JWT)
│   ├── users/             # Módulo de usuarios (CRUD)
│   ├── profile/           # Módulo de perfiles
│   ├── common/            # Filtros, interceptores, decoradores
│   ├── app.module.ts      # Módulo raíz
│   └── main.ts            # Punto de entrada
├── Dockerfile             # Imagen Docker multi-stage
├── docker-compose.yml     # Orquestación de servicios
├── .env.example           # Variables de entorno de ejemplo
└── package.json
```

---

## 🐛 Solución de problemas

### La API aparece como `unhealthy`

```bash
docker-compose logs users-api
```

Verificá que MongoDB esté corriendo y saludable:

```bash
docker-compose logs mongodb
```

### Error `ENOTFOUND mongodb`

Los servicios no están en la misma red de Docker. Verificá que todos los servicios en `docker-compose.yml` tengan la misma `network`.

### Conflicto en el puerto 27017

Si tenés MongoDB instalado localmente en Windows:

```bash
# Detener servicio local
net stop MongoDB

# Verificar qué proceso usa el puerto
netstat -ano | findstr :27017
```

### Mongo Express se reinicia constantemente

Es normal que se reinicie hasta que MongoDB esté listo. Esperá ~1 minuto.

---

## 👤 Autor

Carla - [GitHub](https://github.com/carlitaor) | [LinkedIn](https://www.linkedin.com/in/carlitaor/)
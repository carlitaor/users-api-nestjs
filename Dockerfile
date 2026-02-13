# === Etapa 1: Build ===
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias primero (aprovecha cache de Docker)
COPY package*.json ./

# Instalar todas las dependencias (incluyendo devDependencies para compilar)
RUN npm ci

# Copiar el código fuente
COPY . .

# Compilar el proyecto
RUN npm run build

# === Etapa 2: Producción ===
FROM node:18-alpine AS production

WORKDIR /app

# Crear usuario no-root por seguridad
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copiar solo archivos de dependencias
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Copiar el build compilado desde la etapa anterior
COPY --from=builder /app/dist ./dist

# Cambiar al usuario no-root
USER appuser

# Exponer el puerto del servicio
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production

# Healthcheck para verificar que el servicio está corriendo
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=15s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

# Comando para ejecutar el servicio
CMD ["node", "dist/main.js"]
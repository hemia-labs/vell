# Vell CMS

A lightweight, high-performance Headless CMS built with NestJS and Vue 3.

## 🏗️ Stack Tecnológico

### Backend
- **NestJS** - Framework Node.js progresivo
- **PostgreSQL** - Base de datos relacional
- **TypeORM** - ORM para TypeScript
- **Bun** - Runtime y package manager

### Frontend
- **Vue 3** - Framework JavaScript progresivo
- **Vite** - Build tool de nueva generación
- **TypeScript** - JavaScript con tipado
- **Pinia** - State management
- **Vue Router** - Enrutamiento

## 📦 Estructura del Monorepo

```
vell/
├── backend/          # API NestJS
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── frontend/         # Admin Vue 3
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
└── package.json      # Root workspace config
```

## 🚀 Inicio Rápido

### Prerrequisitos

- [Bun](https://bun.sh) >= 1.0.0
- PostgreSQL >= 14

### Instalación

1. Instalar todas las dependencias:
```bash
bun install
```

2. Iniciar PostgreSQL con Docker (recomendado):
```bash
bun run db:up
```

O crear la base de datos manualmente si tienes PostgreSQL instalado:
```bash
createdb vell_cms
```

3. Configurar variables de entorno del backend:
```bash
cd backend
cp .env.example .env
# Editar .env si usas credenciales diferentes
```

### Desarrollo

#### Iniciar todo el proyecto:
```bash
bun run dev
```

#### Iniciar solo el backend:
```bash
bun run dev:backend
```

#### Iniciar solo el frontend:
```bash
bun run dev:frontend
```

El backend estará disponible en: http://localhost:3000  
El frontend estará disponible en: http://localhost:5173

### Build

```bash
# Build de todo el proyecto
bun run build

# Build individual
bun run build:backend
bun run build:frontend
```

## 📝 Scripts Disponibles

### Root
- `bun run dev` - Inicia backend y frontend
- `bun run db:up` - Inicia PostgreSQL con Docker
- `bun run db:down` - Detiene PostgreSQL
- `bun run db:logs` - Ver logs de PostgreSQL
- `bun run dev:backend` - Inicia solo el backend
- `bun run dev:frontend` - Inicia solo el frontend
- `bun run build` - Build de todo el proyecto
- `bun run build:backend` - Build del backend
- `bun run build:frontend` - Build del frontend

### Backend
- `bun run dev` - Modo desarrollo con hot reload
- `bun run build` - Compilar para producción
- `bun run start` - Iniciar en producción
- `bun run test` - Ejecutar tests

### Frontend
- `bun run dev` - Servidor de desarrollo
- `bun run build` - Build para producción
- `bun run preview` - Preview del build de producción

## 🔧 Configuración

### Base de Datos

Edita `backend/.env` con tus credenciales:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=vell_cms
```

### API Proxy

El frontend está configurado para hacer proxy de las peticiones a `/api` hacia el backend en `http://localhost:3000`.

## 📖 Documentación

- [NestJS](https://docs.nestjs.com)
- [Vue 3](https://vuejs.org)
- [TypeORM](https://typeorm.io)
- [Bun Workspaces](https://bun.sh/docs/guides/install/workspaces)

## 📄 Licencia

MIT


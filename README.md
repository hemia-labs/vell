# Vell CMS

A lightweight, high-performance Headless CMS built with NestJS and Vue 3.

## 🏗️ Stack Tecnológico

### Backend
- **NestJS** - Framework Node.js progresivo
- **PostgreSQL** - Base de datos relacional
- **TypeORM** - ORM para TypeScript
- **pnpm** - Package manager eficiente

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

- [Node.js](https://nodejs.org) >= 18.0.0
- [pnpm](https://pnpm.io) >= 8.0.0
- PostgreSQL >= 14

### Instalación

1. Instalar todas las dependencias:
```bash
pnpm install
```

2. Iniciar PostgreSQL con Docker (recomendado):
```bash
pnpm run db:up
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
pnpm run dev
```

#### Iniciar solo el backend:
```bash
pnpm run dev:backend
```

#### Iniciar solo el frontend:
```bash
pnpm run dev:frontend
```

El backend estará disponible en: http://localhost:3000  
El frontend estará disponible en: http://localhost:5173

### Build

```bash
# Build de todo el proyecto
pnpm run build

# Build individual
pnpm run build:backend
pnpm run build:frontend
```

## 📝 Scripts Disponibles

### Root
- `pnpm run dev` - Inicia backend y frontend en paralelo
- `pnpm run db:up` - Inicia PostgreSQL con Docker
- `pnpm run db:down` - Detiene PostgreSQL
- `pnpm run db:logs` - Ver logs de PostgreSQL
- `pnpm run dev:backend` - Inicia solo el backend
- `pnpm run dev:frontend` - Inicia solo el frontend
- `pnpm run build` - Build de todo el proyecto
- `pnpm run build:backend` - Build del backend
- `pnpm run build:frontend` - Build del frontend
- `pnpm run lint` - Ejecutar linter en todos los paquetes
- `pnpm run clean` - Limpiar node_modules y builds

### Backend
- `pnpm run dev` - Modo desarrollo con hot reload
- `pnpm run build` - Compilar para producción
- `pnpm run start` - Iniciar en producción
- `pnpm run test` - Ejecutar tests
- `pnpm run migration:generate` - Generar migración
- `pnpm run migration:run` - Ejecutar migraciones

### Frontend
- `pnpm run dev` - Servidor de desarrollo
- `pnpm run build` - Build para producción
- `pnpm run preview` - Preview del build de producción

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
pnpm Workspaces](https://pnpm.io

- [NestJS](https://docs.nestjs.com)
- [Vue 3](https://vuejs.org)
- [TypeORM](https://typeorm.io)
- [pnpm Workspaces](https://pnpm.io
## 📄 Licencia

MIT


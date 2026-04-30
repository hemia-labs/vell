import { MigrationInterface, QueryRunner } from "typeorm";
import { hashPassword } from "../../common/utils/hash.util";

const PERMISSIONS = [
  '*',
  'content:*', 'content-types:*', 'pages:*', 'media:*', 'categories:*', 'tags:*', 'users:*', 'settings:*',
  'content:view', 'content:create', 'content:edit', 'content:edit:own', 'content:delete', 'content:restore',
  'content:publish', 'content:unpublish', 'content:archive', 'content:versions:view', 'content:versions:restore',
  'content:seo:edit', 'content:config:edit', 'content:media:manage',
  'content-types:view', 'content-types:create', 'content-types:edit', 'content-types:delete', 'content-types:restore',
  'content-types:versions:view', 'content-types:versions:restore',
  'pages:view', 'pages:create', 'pages:edit', 'pages:delete',
  'media:view', 'media:upload', 'media:edit', 'media:delete', 'media:restore',
  'media:attach', 'media:detach', 'media:reorder',
  'categories:view', 'categories:create', 'categories:edit', 'categories:delete', 'categories:restore', 'categories:move',
  'tags:view', 'tags:create', 'tags:edit', 'tags:delete', 'tags:restore',
  'users:view', 'users:create', 'users:edit', 'users:delete', 'users:restore',
  'roles:view', 'roles:create', 'roles:edit', 'roles:delete', 'roles:assign',
  'settings:view', 'settings:edit',
  'audit:view',
];

const ROLES = [
  { name: 'super-admin', slug: 'super-admin', description: 'Acceso completo', scope: 'Acceso completo', level: 0, permissions: ['*'] },
  { name: 'admin', slug: 'admin', description: 'Acceso administrativo', scope: 'Administración del espacio', level: 1, permissions: ['content:*', 'content-types:*', 'pages:*', 'media:*', 'categories:*', 'tags:*', 'users:*', 'roles:view', 'roles:assign', 'settings:*', 'audit:view'] },
  { name: 'editor', slug: 'editor', description: 'Acceso como editor de contenido', scope: 'Editor de contenido', level: 2, permissions: ['content:*', 'content-types:view', 'content-types:create', 'content-types:edit', 'content-types:versions:view', 'pages:view', 'pages:create', 'pages:edit', 'media:*', 'categories:view', 'categories:create', 'categories:edit', 'categories:move', 'tags:view', 'tags:create', 'tags:edit', 'settings:view'] },
  { name: 'author', slug: 'author', description: 'Acceso como autor de contenido', scope: 'Creación de artículos', level: 3, permissions: ['content:view', 'content:create', 'content:edit:own', 'content:versions:view', 'content:seo:edit', 'content:config:edit', 'content:media:manage', 'content-types:view', 'media:view', 'media:upload', 'media:attach', 'media:detach', 'media:reorder', 'pages:view', 'categories:view', 'tags:view'] },
  { name: 'viewer', slug: 'viewer', description: 'Acceso solo lectura', scope: 'Solo lectura', level: 4, permissions: ['content:view', 'content-types:view', 'pages:view', 'media:view', 'categories:view', 'tags:view'] },
];

type SeedSetting = {
  key: string;
  value: unknown;
  type: 'text' | 'number' | 'boolean' | 'image' | 'array' | 'json';
  group: 'general' | 'content' | 'mail' | 'system' | 'seo';
  description: string;
  isPublic?: boolean;
  isReadonly?: boolean;
};

const SETTINGS: SeedSetting[] = [
  { key: 'site_name', value: 'Mi CMS', type: 'text', group: 'general', isPublic: true, description: 'Nombre del sitio visible en el header y en el SEO' },
  { key: 'site_description', value: 'Un CMS moderno', type: 'text', group: 'general', isPublic: true, description: 'Descripción corta del sitio, usada en meta tags globales' },
  { key: 'site_logo', value: null, type: 'image', group: 'general', isPublic: true, description: 'Logo principal del sitio, seleccionado desde la Media Library' },
  { key: 'site_favicon', value: null, type: 'image', group: 'general', isPublic: true, description: 'Favicon del sitio' },
  { key: 'default_language', value: 'es', type: 'text', group: 'general', isPublic: true, description: 'Idioma por defecto del CMS' },
  { key: 'allowed_languages', value: ['es', 'en', 'fr'], type: 'array', group: 'general', isPublic: true, description: 'Idiomas disponibles en el sitio' },
  { key: 'timezone', value: 'America/Mexico_City', type: 'text', group: 'general', isPublic: true, description: 'Zona horaria del sitio para mostrar fechas' },
  { key: 'posts_per_page', value: 10, type: 'number', group: 'content', isPublic: true, description: 'Número de contenidos por página en los listados' },
  { key: 'allow_comments', value: false, type: 'boolean', group: 'content', isPublic: true, description: 'Habilita o deshabilita comentarios globalmente' },
  { key: 'auto_save_interval', value: 30, type: 'number', group: 'content', description: 'Intervalo en segundos para el auto-guardado en el editor' },
  { key: 'max_upload_size_mb', value: 10, type: 'number', group: 'content', description: 'Tamaño máximo permitido en MB para subir archivos a la Media Library' },
  { key: 'seo_default_title', value: 'Mi CMS - Bienvenido', type: 'text', group: 'seo', isPublic: true, description: 'Título SEO global cuando una página no tiene meta_title propio' },
  { key: 'seo_default_description', value: 'El mejor CMS construido con NestJS', type: 'text', group: 'seo', isPublic: true, description: 'Descripción SEO global por defecto' },
  { key: 'google_analytics_id', value: null, type: 'text', group: 'seo', isPublic: true, description: 'ID de Google Analytics para tracking en el frontend' },
  { key: 'robots_txt', value: 'User-agent: *\nAllow: /', type: 'text', group: 'seo', isPublic: true, description: 'Contenido del archivo robots.txt' },
  { key: 'smtp_host', value: null, type: 'text', group: 'mail', description: 'Host del servidor SMTP para envío de emails' },
  { key: 'smtp_port', value: 587, type: 'number', group: 'mail', description: 'Puerto del servidor SMTP' },
  { key: 'smtp_user', value: null, type: 'text', group: 'mail', description: 'Usuario de autenticación SMTP' },
  { key: 'smtp_password', value: null, type: 'text', group: 'mail', description: 'Contraseña SMTP. Nunca exponer en la API pública' },
  { key: 'mail_from', value: null, type: 'text', group: 'mail', description: 'Dirección remitente en los emails enviados' },
  { key: 'app_version', value: '1.0.0', type: 'text', group: 'system', isReadonly: true, description: 'Versión actual del CMS. Solo se actualiza en deploys' },
  { key: 'maintenance_mode', value: false, type: 'boolean', group: 'system', isPublic: true, description: 'Si es true, el sitio muestra una página de mantenimiento' },
  { key: 'db_seeded', value: true, type: 'boolean', group: 'system', isReadonly: true, description: 'Indica si el seed inicial ya fue ejecutado' },
];

function expandRolePermissions(permissions: string[]): string[] {
  const expanded: string[] = [];
  for (const perm of permissions) {
    if (perm === '*') {
      expanded.push('*');
    } else if (perm.endsWith(':*')) {
      expanded.push(perm);
    } else {
      expanded.push(perm);
    }
  }
  return [...new Set(expanded)];
}

async function seedSettings(queryRunner: QueryRunner): Promise<void> {
  for (const setting of SETTINGS) {
    await queryRunner.query(
      `INSERT INTO "settings" ("key", "value", "type", "group", "description", "is_public", "is_readonly")
       VALUES ($1, $2::jsonb, $3, $4, $5, $6, $7)
       ON CONFLICT ("key") DO UPDATE SET
         "type" = EXCLUDED."type",
         "group" = EXCLUDED."group",
         "description" = EXCLUDED."description",
         "is_public" = EXCLUDED."is_public",
         "is_readonly" = EXCLUDED."is_readonly",
         "updated_at" = now()`,
      [
        setting.key,
        JSON.stringify(setting.value),
        setting.type,
        setting.group,
        setting.description,
        setting.isPublic ?? false,
        setting.isReadonly ?? false,
      ]
    );
  }
}

async function removeSettings(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(
    `DELETE FROM "settings" WHERE "key" IN (${SETTINGS.map((_, index) => `$${index + 1}`).join(', ')})`,
    SETTINGS.map(setting => setting.key)
  );
}

export class SeedRolesAndPermissions1808434165290 implements MigrationInterface {
  name = 'SeedRolesAndPermissions1808434165290';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

    if (!superAdminEmail || !superAdminPassword) {
      console.warn('[SeedRolesAndPermissions] SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set — skipping super-admin user creation');
    }

    for (const slug of PERMISSIONS) {
      await queryRunner.query(
        `INSERT INTO "permissions" ("slug", "description") VALUES ($1, $2) ON CONFLICT ("slug") DO NOTHING`,
        [slug, slug]
      );
    }

    for (const role of ROLES) {
      await queryRunner.query(
        `INSERT INTO "roles" ("name", "slug", "description", "scope", "level") VALUES ($1, $2, $3, $4, $5) ON CONFLICT ("slug") DO NOTHING`,
        [role.name, role.slug, role.description, role.scope, role.level]
      );
      for (const permSlug of expandRolePermissions(role.permissions)) {
        await queryRunner.query(
          `INSERT INTO "role_permissions" ("role_id", "permission_id")
           SELECT r.id, p.id FROM "roles" r, "permissions" p
           WHERE r.slug = $1 AND p.slug = $2
           ON CONFLICT DO NOTHING`,
          [role.slug, permSlug]
        );
      }
    }

    if (superAdminEmail && superAdminPassword) {
      const passwordHash = await hashPassword(superAdminPassword);

      // Seed super-admin user
      await queryRunner.query(
        `INSERT INTO "users" ("name", "email", "password_hash") VALUES ($1, $2, $3) ON CONFLICT ("email") DO NOTHING`,
        ['Super Admin', superAdminEmail, passwordHash]
      );

      // Assign super-admin role to the user
      await queryRunner.query(
        `INSERT INTO "user_roles" ("user_id", "role_id")
         SELECT u.id, r.id FROM "users" u, "roles" r
         WHERE u.email = $1 AND r.slug = 'super-admin'
         ON CONFLICT DO NOTHING`,
        [superAdminEmail]
      );
    }

    await seedSettings(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;

    await removeSettings(queryRunner);

    if (!superAdminEmail) {
      console.warn('[SeedRolesAndPermissions] SUPER_ADMIN_EMAIL not set — skipping user cleanup');
    } else {

    // Remove super-admin user
    await queryRunner.query(
      `DELETE FROM "user_roles" WHERE "user_id" = (SELECT id FROM "users" WHERE email = $1)`,
      [superAdminEmail]
    );
    await queryRunner.query(
      `DELETE FROM "users" WHERE "email" = $1`,
      [superAdminEmail]
    );

    for (const role of ROLES) {
      await queryRunner.query(
        `DELETE FROM "role_permissions" WHERE "role_id" = (SELECT id FROM "roles" WHERE slug = $1)`,
        [role.slug]
      );
    }
    await queryRunner.query(
      `DELETE FROM "roles" WHERE "slug" IN (${ROLES.map((r, i) => `$${i + 1}`).join(', ')})`,
      ROLES.map(r => r.slug)
    );
    await queryRunner.query(
      `DELETE FROM "permissions" WHERE "slug" IN (${PERMISSIONS.map((p, i) => `$${i + 1}`).join(', ')})`,
      PERMISSIONS
    );
    }
  }
}

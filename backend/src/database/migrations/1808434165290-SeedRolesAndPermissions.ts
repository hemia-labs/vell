import { MigrationInterface, QueryRunner } from "typeorm";
import { hashPassword } from "../../common/utils/hash.util";

const PERMISSIONS = [
  '*',
  'content:*', 'content-types:*', 'pages:*', 'media:*', 'categories:*', 'tags:*', 'users:*', 'settings:*',
  'content:view', 'content:create', 'content:edit', 'content:edit:own', 'content:delete',
  'content-types:view', 'content-types:create', 'content-types:edit', 'content-types:delete',
  'pages:view', 'pages:create', 'pages:edit', 'pages:delete',
  'media:view', 'media:upload', 'media:edit', 'media:delete',
  'categories:view', 'categories:create', 'categories:edit', 'categories:delete',
  'tags:view', 'tags:create', 'tags:edit', 'tags:delete',
  'users:view', 'users:create', 'users:edit', 'users:delete',
  'roles:view', 'roles:create', 'roles:edit', 'roles:delete',
  'settings:view', 'settings:edit',
  'audit:view',
];

const ROLES = [
  { name: 'super-admin', slug: 'super-admin', description: 'Acceso completo', scope: 'Acceso completo', level: 0, permissions: ['*'] },
  { name: 'admin', slug: 'admin', description: 'Acceso administrativo', scope: 'Administración del espacio', level: 1, permissions: ['content:*', 'content-types:*', 'pages:*', 'media:*', 'categories:*', 'tags:*', 'users:*', 'roles:view', 'settings:*', 'audit:view'] },
  { name: 'editor', slug: 'editor', description: 'Acceso como editor de contenido', scope: 'Editor de contenido', level: 2, permissions: ['content:*', 'content-types:view', 'content-types:create', 'content-types:edit', 'pages:view', 'pages:create', 'pages:edit', 'media:*', 'categories:view', 'categories:create', 'categories:edit', 'tags:view', 'tags:create', 'tags:edit', 'settings:view'] },
  { name: 'author', slug: 'author', description: 'Acceso como autor de contenido', scope: 'Creación de artículos', level: 3, permissions: ['content:view', 'content:create', 'content:edit:own', 'content-types:view', 'media:view', 'media:upload', 'pages:view', 'categories:view', 'tags:view'] },
  { name: 'viewer', slug: 'viewer', description: 'Acceso solo lectura', scope: 'Solo lectura', level: 4, permissions: ['content:view', 'content-types:view', 'pages:view', 'media:view', 'categories:view', 'tags:view'] },
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;

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

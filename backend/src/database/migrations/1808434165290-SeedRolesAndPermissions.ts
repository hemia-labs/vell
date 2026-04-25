import { MigrationInterface, QueryRunner } from "typeorm";
import { hashPassword } from "../../common/utils/hash.util";

const PERMISSIONS = [
  '*',
  'content:*', 'pages:*', 'media:*', 'users:*', 'settings:*',
  'content:view', 'content:create', 'content:edit', 'content:edit:own', 'content:delete',
  'pages:view', 'pages:create', 'pages:edit', 'pages:delete',
  'media:view', 'media:upload', 'media:edit', 'media:delete',
  'users:view', 'users:create', 'users:edit', 'users:delete',
  'roles:view', 'roles:create', 'roles:edit', 'roles:delete',
  'settings:view', 'settings:edit',
  'audit:view',
];

const ROLES = [
  { name: 'super-admin', slug: 'super-admin', description: 'Acceso completo', scope: 'Acceso completo', permissions: ['*'] },
  { name: 'admin', slug: 'admin', description: 'Acceso administrativo', scope: 'Administración del espacio', permissions: ['content:*', 'pages:*', 'media:*', 'users:*', 'roles:view', 'settings:*', 'audit:view'] },
  { name: 'editor', slug: 'editor', description: 'Acceso como editor de contenido', scope: 'Editor de contenido', permissions: ['content:*', 'pages:view', 'pages:create', 'pages:edit', 'media:*', 'settings:view'] },
  { name: 'author', slug: 'author', description: 'Acceso como autor de contenido', scope: 'Creación de artículos', permissions: ['content:view', 'content:create', 'content:edit:own', 'media:view', 'media:upload', 'pages:view'] },
  { name: 'viewer', slug: 'viewer', description: 'Acceso solo lectura', scope: 'Solo lectura', permissions: ['content:view', 'pages:view', 'media:view'] },
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
    // Super admin from env
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@example.com';
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'superadminpassword';
    const passwordHash = await hashPassword(superAdminPassword);

    for (const slug of PERMISSIONS) {
      await queryRunner.query(
        `INSERT INTO "permissions" ("slug", "description") VALUES ($1, $2) ON CONFLICT ("slug") DO NOTHING`,
        [slug, slug]
      );
    }

    for (const role of ROLES) {
      await queryRunner.query(
        `INSERT INTO "roles" ("name", "slug", "description", "scope") VALUES ($1, $2, $3, $4) ON CONFLICT ("slug") DO NOTHING`,
        [role.name, role.slug, role.description, role.scope]
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@example.com';

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
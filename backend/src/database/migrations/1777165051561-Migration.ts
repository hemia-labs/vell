import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1777165051561 implements MigrationInterface {
    name = 'Migration1777165051561'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "slug" character varying NOT NULL, "description" character varying NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_d090ad82a0e97ce764c06c7b312" UNIQUE ("slug"), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "description" character varying, "scope" character varying, "level" integer NOT NULL DEFAULT '99', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "UQ_881f72bac969d9a00a1a29e1079" UNIQUE ("slug"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "token" text NOT NULL, "expires_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "is_revoked" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_refresh_token_expires_at" ON "refresh_tokens" ("expires_at") `);
        await queryRunner.query(`CREATE INDEX "idx_refresh_token_user_id" ON "refresh_tokens" ("user_id") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "password_hash" character varying(255) NOT NULL, "avatar_url" character varying(255), "last_login" TIMESTAMP, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "content_type_fields" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content_type_id" uuid NOT NULL, "name" character varying(100) NOT NULL, "field_key" character varying(100) NOT NULL, "field_type" "public"."content_type_fields_field_type_enum" NOT NULL, "is_required" boolean NOT NULL DEFAULT false, "order" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_dceae79de0eeb2185dc2622facf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "content_types" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "slug" character varying(100) NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_7635b59b8e89fdf4314d1436eac" UNIQUE ("name"), CONSTRAINT "UQ_775a1211f929b2806caa835f64c" UNIQUE ("slug"), CONSTRAINT "PK_ce94145fcda04af3b3153f44f2f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "slug" character varying(100) NOT NULL, "description" text, "parent_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_420d9f679d41281f282f5bc7d09" UNIQUE ("slug"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "media" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "filename" character varying(255) NOT NULL, "original_name" character varying(255) NOT NULL, "mime_type" character varying(100) NOT NULL, "size" integer NOT NULL, "url" text NOT NULL, "storage" "public"."media_storage_enum" NOT NULL, "uploaded_by" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_f4e0fcac36e050de337b670d8bd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "content_field_values" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content_id" uuid NOT NULL, "field_id" uuid NOT NULL, "value" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_39bd279c225fdb1bd74f0b0757e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "contents" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "body" jsonb, "excerpt" text, "status" "public"."contents_status_enum" NOT NULL DEFAULT 'draft', "content_type_id" uuid NOT NULL, "category_id" uuid, "author_id" uuid NOT NULL, "cover_image_id" uuid, "meta_title" character varying(255), "meta_description" text, "published_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_b7c504072e537532d7080c54fac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_610c11b22d3bac01c0a6bfc667" ON "contents" ("slug", "content_type_id") `);
        await queryRunner.query(`CREATE TABLE "tags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "slug" character varying(100) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_d90243459a697eadb8ad56e9092" UNIQUE ("name"), CONSTRAINT "UQ_b3aa10c29ea4e61a830362bd25a" UNIQUE ("slug"), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying(100) NOT NULL, "value" jsonb, "type" "public"."settings_type_enum" NOT NULL DEFAULT 'text', "group" character varying(100) NOT NULL DEFAULT 'general', "description" text, "is_public" boolean NOT NULL DEFAULT false, "is_readonly" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_c8639b7626fa94ba8265628f214" UNIQUE ("key"), CONSTRAINT "PK_0669fe20e252eb692bf4d344975" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "pages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "body" jsonb, "template" character varying(100), "status" "public"."pages_status_enum" NOT NULL DEFAULT 'draft', "meta_title" character varying(255), "meta_description" text, "author_id" uuid NOT NULL, "published_at" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_fe66ca6a86dc94233e5d7789535" UNIQUE ("slug"), CONSTRAINT "UQ_fe66ca6a86dc94233e5d7789535" UNIQUE ("slug"), CONSTRAINT "PK_8f21ed625aa34c8391d636b7d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "content_versions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content_id" uuid NOT NULL, "title" character varying(255) NOT NULL, "body" jsonb, "field_values_snapshot" jsonb, "version" integer NOT NULL, "saved_by" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_77046b137eb8001947fc332e594" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d458d2d56b4f5f9724b43c3cae" ON "content_versions" ("content_id", "version") `);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid, "action" character varying(100) NOT NULL, "entity" character varying(100) NOT NULL, "entity_id" character varying, "before" jsonb, "after" jsonb, "result" "public"."audit_logs_result_enum" NOT NULL DEFAULT 'success', "ip_address" character varying(45), "user_agent" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "role_permissions" ("role_id" uuid NOT NULL, "permission_id" uuid NOT NULL, CONSTRAINT "PK_25d24010f53bb80b78e412c9656" PRIMARY KEY ("role_id", "permission_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_178199805b901ccd220ab7740e" ON "role_permissions" ("role_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_17022daf3f885f7d35423e9971" ON "role_permissions" ("permission_id") `);
        await queryRunner.query(`CREATE TABLE "user_roles" ("user_id" uuid NOT NULL, "role_id" uuid NOT NULL, CONSTRAINT "PK_23ed6f04fe43066df08379fd034" PRIMARY KEY ("user_id", "role_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_87b8888186ca9769c960e92687" ON "user_roles" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b23c65e50a758245a33ee35fda" ON "user_roles" ("role_id") `);
        await queryRunner.query(`CREATE TABLE "content_tags" ("content_id" uuid NOT NULL, "tag_id" uuid NOT NULL, CONSTRAINT "PK_704201a473cfe0e2f646bea32b3" PRIMARY KEY ("content_id", "tag_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b957bee53dd842e59e479e9afd" ON "content_tags" ("content_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_2346c63b132eacb6cf5a8ccaac" ON "content_tags" ("tag_id") `);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "content_type_fields" ADD CONSTRAINT "FK_caba0d12a97886902c84aa4956c" FOREIGN KEY ("content_type_id") REFERENCES "content_types"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_88cea2dc9c31951d06437879b40" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "media" ADD CONSTRAINT "FK_8468de6d91985f53a1a3324741c" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "content_field_values" ADD CONSTRAINT "FK_fdb3d72715866553666508cb803" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "content_field_values" ADD CONSTRAINT "FK_93d50fbc67a8d6965826c516e5b" FOREIGN KEY ("field_id") REFERENCES "content_type_fields"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contents" ADD CONSTRAINT "FK_74aceae9af8fb7bcf5bb62c15bf" FOREIGN KEY ("content_type_id") REFERENCES "content_types"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contents" ADD CONSTRAINT "FK_5eef62af59eab910a4bf3b09d3e" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contents" ADD CONSTRAINT "FK_ef9aa2f7890c5652724605b6724" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "contents" ADD CONSTRAINT "FK_c1e607239ad3d35ea6b89161112" FOREIGN KEY ("cover_image_id") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pages" ADD CONSTRAINT "FK_4cfa4caf7f1c553220d70987fb2" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "content_versions" ADD CONSTRAINT "FK_cb8a809d2d0f4c61e0b03eec94c" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "content_versions" ADD CONSTRAINT "FK_a393baad0f3bdfaaed3961a75b3" FOREIGN KEY ("saved_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "content_tags" ADD CONSTRAINT "FK_b957bee53dd842e59e479e9afde" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "content_tags" ADD CONSTRAINT "FK_2346c63b132eacb6cf5a8ccaacd" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content_tags" DROP CONSTRAINT "FK_2346c63b132eacb6cf5a8ccaacd"`);
        await queryRunner.query(`ALTER TABLE "content_tags" DROP CONSTRAINT "FK_b957bee53dd842e59e479e9afde"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_87b8888186ca9769c960e926870"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_17022daf3f885f7d35423e9971e"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_bd2726fd31b35443f2245b93ba0"`);
        await queryRunner.query(`ALTER TABLE "content_versions" DROP CONSTRAINT "FK_a393baad0f3bdfaaed3961a75b3"`);
        await queryRunner.query(`ALTER TABLE "content_versions" DROP CONSTRAINT "FK_cb8a809d2d0f4c61e0b03eec94c"`);
        await queryRunner.query(`ALTER TABLE "pages" DROP CONSTRAINT "FK_4cfa4caf7f1c553220d70987fb2"`);
        await queryRunner.query(`ALTER TABLE "contents" DROP CONSTRAINT "FK_c1e607239ad3d35ea6b89161112"`);
        await queryRunner.query(`ALTER TABLE "contents" DROP CONSTRAINT "FK_ef9aa2f7890c5652724605b6724"`);
        await queryRunner.query(`ALTER TABLE "contents" DROP CONSTRAINT "FK_5eef62af59eab910a4bf3b09d3e"`);
        await queryRunner.query(`ALTER TABLE "contents" DROP CONSTRAINT "FK_74aceae9af8fb7bcf5bb62c15bf"`);
        await queryRunner.query(`ALTER TABLE "content_field_values" DROP CONSTRAINT "FK_93d50fbc67a8d6965826c516e5b"`);
        await queryRunner.query(`ALTER TABLE "content_field_values" DROP CONSTRAINT "FK_fdb3d72715866553666508cb803"`);
        await queryRunner.query(`ALTER TABLE "media" DROP CONSTRAINT "FK_8468de6d91985f53a1a3324741c"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_88cea2dc9c31951d06437879b40"`);
        await queryRunner.query(`ALTER TABLE "content_type_fields" DROP CONSTRAINT "FK_caba0d12a97886902c84aa4956c"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_3ddc983c5f7bcf132fd8732c3f4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2346c63b132eacb6cf5a8ccaac"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b957bee53dd842e59e479e9afd"`);
        await queryRunner.query(`DROP TABLE "content_tags"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b23c65e50a758245a33ee35fda"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_87b8888186ca9769c960e92687"`);
        await queryRunner.query(`DROP TABLE "user_roles"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_17022daf3f885f7d35423e9971"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_178199805b901ccd220ab7740e"`);
        await queryRunner.query(`DROP TABLE "role_permissions"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d458d2d56b4f5f9724b43c3cae"`);
        await queryRunner.query(`DROP TABLE "content_versions"`);
        await queryRunner.query(`DROP TABLE "pages"`);
        await queryRunner.query(`DROP TABLE "settings"`);
        await queryRunner.query(`DROP TABLE "tags"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_610c11b22d3bac01c0a6bfc667"`);
        await queryRunner.query(`DROP TABLE "contents"`);
        await queryRunner.query(`DROP TABLE "content_field_values"`);
        await queryRunner.query(`DROP TABLE "media"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TABLE "content_types"`);
        await queryRunner.query(`DROP TABLE "content_type_fields"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."idx_refresh_token_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_refresh_token_expires_at"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
    }

}

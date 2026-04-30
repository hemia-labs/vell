import * as Joi from 'joi';

export const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.number().default(3600), // 1 hour
  REFRESH_TOKEN_EXPIRES_IN: Joi.number().default(604800), // 7 days
  BCRYPT_SALT_ROUNDS: Joi.number().default(10),
  FRONTEND_URL: Joi.string().uri().required(),
  ROLES_WRITE_ENABLED: Joi.string().valid('true', 'false').optional().default('false'),
  S3_ENDPOINT: Joi.string().uri().optional().allow(''),
  S3_REGION: Joi.string().optional().default('us-east-1'),
  S3_BUCKET: Joi.string().optional().allow(''),
  S3_ACCESS_KEY_ID: Joi.string().optional().allow(''),
  S3_SECRET_ACCESS_KEY: Joi.string().optional().allow(''),
  S3_FORCE_PATH_STYLE: Joi.string().optional().default('false'),
  S3_PUBLIC_URL: Joi.string().uri().optional().allow(''),
  S3_PRESIGNED_URL_TTL: Joi.number().optional().default(600),
});

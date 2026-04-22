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
  FRONTEND_URL: Joi.string().uri().required(),
});
import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.url(),
  VITE_TIMEOUT: z.string().transform(Number).default(10000),
  VITE_ROLES_WRITE_ENABLED: z.string().optional().transform(value => value === 'true'),
});

const _env = envSchema.safeParse(import.meta.env);

if (!_env.success) {
  console.error('❌ Error en variables de entorno:', z.treeifyError(_env.error));
  throw new Error('Configuración inválida');
}

export const env = _env.data;
export type EnvConfig = z.infer<typeof envSchema>;

import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  HOST: z.string().default('0.0.0.0'),
  JWT_SECRET: z.string().min(10, "A chave JWT_SECRET precisa ser uma string segura"),
  DATABASE_URL: z.string().url(),
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  console.error('❌ Variáveis de ambiente inválidas ou ausentes:', _env.error.format());
  process.exit(1); // Derruba a aplicação imediatamente para segurança
}

export const env = _env.data;
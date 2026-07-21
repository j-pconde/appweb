// npm install zod
// verificar
// "dependencies": {
//   "zod": "^3.x.x"
// }
import { z } from 'zod';

export const getProductParamsSchema = z.object({
  slug: z.string().min(1, "O slug do produto é obrigatório"),
});
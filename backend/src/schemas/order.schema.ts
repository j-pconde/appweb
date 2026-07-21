import { z } from 'zod';

export const createOrderBodySchema = z.object({
  customerName: z.string().min(3),
  customerEmail: z.string().email(),
  items: z.array(
    z.object({
      productVariantId: z.string(), // ID da variação (Ex: ID da Saia Midi P)
      quantity: z.number().int().positive(),
    })
  ).min(1, "O pedido precisa ter pelo menos um item"),
});
import { z } from 'zod';

export const mercadoPagoWebhookSchema = z.object({
  action: z.string(), // ex: "payment.created" ou "payment.updated"
  data: z.object({
    id: z.string(), // O ID do pagamento dentro do Mercado Pago
  }),
});
import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { mercadoPagoWebhookSchema } from '../schemas/webhook.schema';

export async function webhookRoutes(app: FastifyInstance) {
  
  app.post('/webhooks/payment', async (request, reply) => {
    try {
      // 1. Valida se o formato enviado pelo Gateway está correto
      const { action, data } = mercadoPagoWebhookSchema.parse(request.body);

      // 2. Se o evento for de atualização de pagamento
      if (action === 'payment.updated' || action === 'payment.created') {
        const paymentId = data.id;

        // [Nota] Em um cenário real, aqui você faria um GET na API do Mercado Pago 
        // usando esse paymentId para verificar se o status real é "approved".
        // Vamos simular que recebemos o status APROVADO:
        const isApproved = true; 

        if (isApproved) {
          // 3. Atualiza o status do pedido no banco de dados
          // Buscamos o pedido que está atrelado a esse ID de pagamento do gateway
          const order = await prisma.order.findUnique({
            where: { paymentId: paymentId },
          });

          if (order) {
            await prisma.order.update({
              where: { id: order.id },
              data: { status: 'PAID' },
            });
            
            app.log.info(`💰 Pedido ${order.id} atualizado para PAGO via Webhook.`);
          }
        }
      }

      // O gateway exige que você retorne um status 200/201 imediatamente 
      // para ele saber que o seu servidor recebeu o aviso.
      return reply.status(200).send({ received: true });

    } catch (error: any) {
      app.log.error(error);
      // Mesmo se der erro na validação, retornamos 200 ou 400 controlado para o gateway não ficar tentando infinitamente
      return reply.status(400).send({ error: 'Fha no processamento do webhook' });
    }
  });
}
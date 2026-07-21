import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { createOrderBodySchema } from '../schemas/order.schema';
import { authenticate } from '../hooks/auth.hook'; // <-- Nova importação

type JwtUser = {
  sub: string;
};

export async function orderRoutes(app: FastifyInstance) {
  app.post(
    '/orders', 
    { onRequest: [authenticate] }, // <-- O segurança foi colocado na porta da rota!
    async (request, reply) => {
      // 1. Agora o schema NÃO precisa mais validar o userId vindo do Body!
      const { customerName, customerEmail, items } = createOrderBodySchema.parse(request.body);

      // 2. Pegamos o ID do usuário diretamente do Token JWT verificado
      const userId = (request.user as JwtUser).sub;

      try {
        const order = await prisma.$transaction(async (tx: any) => {
          let calculatedTotal = 0;
          const orderItemsData = [];

          for (const item of items) {
            const variant = await tx.productVariant.findUnique({
              where: { id: item.productVariantId },
              include: { product: true },
            });

            if (!variant) {
              throw new Error(`Variação de produto com ID ${item.productVariantId} não encontrada.`);
            }

            if (variant.stock < item.quantity) {
              throw new Error(`Estoque insuficiente para o produto ${variant.product.name} (Tamanho ${variant.size}). Disponível: ${variant.stock}`);
            }

            await tx.productVariant.update({
              where: { id: variant.id },
              data: {
                stock: { decrement: item.quantity },
              },
            });

            const currentPrice = variant.price ?? variant.product.price;
            const itemPrice = Number(currentPrice) * item.quantity;
            calculatedTotal += itemPrice;

            orderItemsData.push({
              variantId: variant.id,
              quantity: item.quantity,
              price: currentPrice,
            });
          }

          const newOrder = await tx.order.create({
            data: {
              userId, // <-- Injetado de forma 100% segura pelo JWT
              totalAmount: calculatedTotal,
              shippingCost: 0.00,
              paymentMethod: "PIX",
              //paymentId: "pay_987654321_isiwa", // <-- Adicione essa linha temporária para bater com o Python
              shippingAddress: "Endereço de Teste, 123",
              status: "PENDING",
              items: {
                create: orderItemsData,
              },
            },
            include: {
              items: true,
            },
          });

          return newOrder;
        });

        return reply.status(201).send({
          message: "🛒 Pedido realizado e estoque reservado com sucesso!",
          order,
        });

      } catch (error: any) {
        return reply.status(400).send({
          error: "Falha ao processar o pedido",
          message: error.message,
        });
      }
    }
  );
}
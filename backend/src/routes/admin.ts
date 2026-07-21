import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../hooks/auth.hook';

// Schema para validar a entrada do estoque
const updateStockBodySchema = z.object({
  quantity: z.number().int("A quantidade precisa ser um número inteiro"), 
  mode: z.enum(['add', 'set']).default('add'), // 'add' soma ao estoque atual, 'set' substitui o valor
});

const updateStockParamsSchema = z.object({
  variantId: z.string().uuid("ID da variação inválido"),
});

export async function adminRoutes(app: FastifyInstance) {
  
  // Rota para validar a sessão do painel administrativo
  app.get(
    '/admin/me',
    { onRequest: [authenticate] }, // Reaproveita o seu hook de validação JWT
    async (request, reply) => {
      // Extrai os dados do token JWT usando a mesma tipagem que você já usa
      const { sub, role } = request.user as { sub: string; name: string; role: 'ADMIN' | 'CUSTOMER' };

      if (role !== 'ADMIN') {
        return reply.status(403).send({ 
          error: 'Acesso negado', 
          message: 'Esta rota é exclusiva para administradores do sistema.' 
        });
      }

      try {
        // Busca os dados atualizados do administrador no banco
        const admin = await prisma.user.findUnique({
          where: { id: sub },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        });

        if (!admin) {
          return reply.status(404).send({ message: 'Administrador não encontrado.' });
        }

        // Retorna o objeto envelopado em 'user', exatamente como o seu AuthContext espera
        return reply.send({
          user: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role
          }
        });

      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ error: 'Erro interno ao validar sessão.' });
      }
    }
  );

  
  // Rota para dar entrada de novos fardos/lotes de produção
  app.patch(
    '/admin/variants/:variantId/stock',
    { onRequest: [authenticate] }, // 1. Verifica se está logado via JWT
    async (request, reply) => {
      // 2. Proteção de Nível de Acesso: Só permite se for ADMIN
      // Extraímos o sub e o role forçando o TypeScript a reconhecer o formato correto
        const { role } = request.user as { sub: string; name: string; role: 'ADMIN' | 'CUSTOMER' };

        if (role !== 'ADMIN') {
            return reply.status(403).send({ 
                error: 'Acesso negado', 
                message: 'Esta rota é exclusiva para administradores do sistema.' 
            });
        }

      const { variantId } = updateStockParamsSchema.parse(request.params);
      const { quantity, mode } = updateStockBodySchema.parse(request.body);

      try {
        // Verifica se a variação da peça existe
        const variant = await prisma.productVariant.findUnique({
          where: { id: variantId },
          include: { product: true }
        });

        if (!variant) {
          return reply.status(404).send({ message: 'Variação de produto não encontrada.' });
        }

        // Calcula o novo estoque dependendo do modo escolhido
        const newStockValue = mode === 'add' ? variant.stock + quantity : quantity;

        if (newStockValue < 0) {
          return reply.status(400).send({ message: 'O estoque final não pode ser negativo.' });
        }

        // Atualiza a tabela no banco de dados
        const updatedVariant = await prisma.productVariant.update({
          where: { id: variantId },
          data: { stock: newStockValue },
        });

        return reply.send({
          message: `Estoque do produto "${variant.product.name}" (Grade: ${variant.size} - ${variant.color}) atualizado com sucesso!`,
          previousStock: variant.stock,
          currentStock: updatedVariant.stock,
        });

      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ error: 'Erro ao atualizar o estoque.' });
      }
    }
  );
}
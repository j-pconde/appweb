import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js'; // ajuste o caminho do seu prisma client

export async function categoryRoutes(app: FastifyInstance) {
  // GET /categories - Retorna todas as categorias para preencher o SELECT do painel
  app.get('/categories', async (request, reply) => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' }
      });
      return reply.send(categories);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao buscar categorias.' });
    }
  });
}
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


  // POST /categories - Cria uma nova categoria
  app.post('/categories', async (request, reply) => {
    try {
      // 1. Extrai o name e o slug do corpo da requisição (body)
      const { name, slug } = request.body as { name: string; slug: string };

      // 2. Validação básica para garantir que os campos não estão vazios
      if (!name || !slug) {
        return reply.status(400).send({ error: 'Os campos "name" e "slug" são obrigatórios.' });
      }

      // 3. Executa a criação no banco de dados MySQL usando o Prisma
      const newCategory = await prisma.category.create({
        data: {
          name,
          slug,
        },
      });

      // 4. Retorna o status 201 (Created) junto com a categoria criada
      return reply.status(201).send(newCategory);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao criar categoria.' });
    }
  });
}




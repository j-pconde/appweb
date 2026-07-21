import type { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { getProductParamsSchema } from '../schemas/product.schema.js';
import { z } from 'zod';

// Helper para gerar Slugs a partir do nome do produto
function generateSlug(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Substitui espaços por hífen
    .replace(/[^\w-]+/g, '') // Remove caracteres especiais
    .replace(/--+/g, '-'); // Remove hífens duplicados
}

// Helper para gerar SKUs limpos e padronizados
function generateSKU(productName: string, color: string, size: string): string {
  const clean = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `${clean(productName)}-${clean(color)}-${clean(size)}`;
}

export async function productRoutes(app: FastifyInstance) {
  
  // 1. Rota de listagem geral (Vitrine & Admin)
  app.get('/products', async (request, reply) => {
    try {
      const products = await prisma.product.findMany({
        where: { isActive: true }, 
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          variants: {
            select: {
              id: true,
              sku: true,
              estampa: true,
              color: true,
              size: true,
              stock: true,
              price: true,
              active: true, 
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return reply.send(products);
    } catch (error) {
      app.log.error(error);
      return reply.status(500).send({ error: 'Erro interno ao buscar produtos.' });
    }
  });

  // 2. Rota do detalhe do produto por slug
  app.get('/products/:slug', async (request, reply) => {
    try {
      const { slug } = getProductParamsSchema.parse(request.params);

      const product = await prisma.product.findUnique({
        where: { slug },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          variants: {
            orderBy: {
              size: 'asc',
            },
          },
        },
      });

      if (!product) {
        return reply.status(404).send({ message: 'Produto não encontrado.' });
      }

      return reply.send(product);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Parâmetros inválidos', details: error.errors });
      }
      app.log.error(error);
      return reply.status(500).send({ error: 'Erro interno ao buscar o produto.' });
    }
  });

  // 3. Rota de Criação de Modelo (Apenas dados iniciais)
  app.post('/products', async (request, reply) => {
    try {
      const createProductSchema = z.object({
        name: z.string().min(1),
        categoryId: z.string().uuid(),
        price: z.number().positive(),
        description: z.string().default(''),
      });

      const { name, categoryId, price, description } = createProductSchema.parse(request.body);
      const slug = generateSlug(name);

      // Verifica se o slug já existe
      const existing = await prisma.product.findUnique({ where: { slug } });
      if (existing) {
        return reply.status(400).send({ error: 'Já existe um produto com um nome semelhante.' });
      }

      const product = await prisma.product.create({
        data: {
          name,
          slug,
          description,
          price,
          images: '', // Inicialmente sem imagens
          categoryId,
        },
        include: {
          variants: true,
        }
      });

      return reply.status(201).send(product);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Dados de envio inválidos', details: error.errors });
      }
      app.log.error(error);
      return reply.status(500).send({ error: 'Erro ao cadastrar modelo.' });
    }
  });


// 4. Rota para salvar toda a Grade / Variantes (PUT)
  app.put('/products/:id/grid', async (request, reply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const bodySchema = z.object({
      name: z.string(),
      price: z.number().positive(),
      categoryId: z.string().uuid(),
      description: z.string().default(''),
      variants: z.array(
        z.object({
          size: z.string(),
          estampa: z.string().default('Liso'),
          color: z.string(),
          stock: z.number().int().nonnegative(),
          active: z.boolean().default(true),
        })
      ),
    });

    try {
      const { id } = paramsSchema.parse(request.params);
      const { name, price, categoryId, description, variants } = bodySchema.parse(request.body);

      const generatedSlug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')    
        .replace(/\s+/g, '-')            
        .replace(/-+/g, '-');            

      await prisma.$transaction(async (tx: any) => {
        // Atualiza os dados básicos do Produto
        await tx.product.update({
          where: { id },
          data: {
            name,
            slug: generatedSlug,
            price,
            categoryId,
            description,
          },
        });

        // 🔥 IMPORTANTE: Em vez de excluir fisicamente do banco, limpamos apenas o que
        // vai ser reescrito nesta transação para não duplicar SKU.
        await tx.productVariant.deleteMany({
          where: { productId: id },
        });

        // Cria as novas variantes mapeando o novo Schema
        for (const variant of variants) {
          const cleanName = name.toUpperCase().replace(/\s+/g, '-');
          const cleanEstampa = variant.estampa.toUpperCase().replace(/\s+/g, '-');
          const cleanColor = variant.color.toUpperCase().replace(/\s+/g, '-');
          const generatedSku = `${cleanName}-${variant.size}-${cleanEstampa}-${cleanColor}`;

          await tx.productVariant.create({
            data: {
              sku: generatedSku,
              size: variant.size,
              estampa: variant.estampa,
              color: variant.color,
              stock: variant.stock,
              price: price,
              active: variant.active, // 🔥 Grava se a variação está ativa ou inativa
              productId: id,
            },
          });
        }
      });

      return reply.status(200).send({ message: 'Grade atualizada com sucesso!' });

    } catch (error) {
      request.log.error(error); 
      return reply.status(400).send({ error: 'Erro ao atualizar a grade do produto.' });
    }
  });


  
  // 5. Rota de Exclusão
  app.delete('/products/:id', async (request, reply) => {
    try {
      const paramsSchema = z.object({
        id: z.string().uuid(),
      });
      
      const { id } = paramsSchema.parse(request.params);

      // Ao deletar o produto, o Prisma deletará as variantes em cascata 
      // (conforme configurado no seu schema: onDelete: Cascade)
      await prisma.product.delete({
        where: { id },
      });

      return reply.status(200).send({ message: 'Produto removido com sucesso!' });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: 'Erro ao excluir o produto.' });
    }
  });

}
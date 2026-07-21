import type { FastifyReply, FastifyRequest } from 'fastify';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    // O jwtVerify() configurado com a opção abaixo vai tentar ler:
    // 1. O cabeçalho 'Authorization: Bearer <TOKEN>'
    // 2. Se não encontrar, lê o cookie definido nas configurações do server.ts
    await request.jwtVerify();
  } catch (err) {
    return reply.status(401).send({ 
      error: 'Não autorizado', 
      message: 'Sua sessão expirou ou o token é inválido.' 
    });
  }
}


import "@fastify/jwt";

declare module "fastify" {
  interface FastifyRequest {
    user: {
      sub: string;
      name: string;
      role: 'ADMIN' | 'CUSTOMER'; // <-- Adicione o papel aqui nas tipagens
    };
  }
}


import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import { env } from './config/env.js';
import { productRoutes } from './routes/products';
import { orderRoutes } from './routes/orders';
import { authRoutes } from './routes/auth';
import { webhookRoutes } from './routes/webhooks';
import { adminRoutes } from './routes/admin';
import { categoryRoutes } from './routes/categories';

const app = Fastify({ logger: true });

// Configura o CORS sem o await no nível raiz
app.register(cors, {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://sinchi.com.br'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

app.register(fastifyCookie, {
  secret: 'sua-chave-secreta-para-assinar-cookies',
});

app.register(jwt, {
  secret: process.env.JWT_SECRET || 'sua-chave-secreta-do-jwt',
  cookie: {
    cookieName: 'token',
    signed: false,
  },
});

// Registrar rotas
app.register(authRoutes);
app.register(adminRoutes);
app.register(categoryRoutes);
app.register(productRoutes);
app.register(orderRoutes);
app.register(webhookRoutes);

app.get('/', async (request, reply) => {
  return {
    status: 'online',
    service: 'Piscallo API',
    timestamp: new Date().toISOString()
  };
});

const start = async () => {
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`🚀 Servidor executando em http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
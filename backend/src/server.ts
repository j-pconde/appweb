console.log("=== INICIANDO O SCRIPT DO SERVIDOR ===");

import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie'; // 1. Importa o plugin de cookies
import { env } from './config/env'; // <-- Importa o validador de ambiente
import { productRoutes } from './routes/products';
import { orderRoutes } from './routes/orders';
import { authRoutes } from './routes/auth';
import { webhookRoutes } from './routes/webhooks';
import { adminRoutes } from './routes/admin'; // <-- Importação
import { categoryRoutes } from './routes/categories';

const app = Fastify({ logger: true });

// Configura o segredo do JWT usando a variável de ambiente segura
await app.register(cors, {
  origin: [
    'http://localhost:3000', // Frontend Cliente
    'http://localhost:3001'  // Frontend Admin
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Necessário para aceitar Cookies/Tokens via HttpOnly
});

// Registrar o Fastify Cookie ANTES do JWT e das Rotas
app.register(fastifyCookie, {
  secret: 'sua-chave-secreta-para-assinar-cookies', // Troque por uma string segura
});

// No seu src/server.ts, deixe o registro do JWT minimalista:
// app.register(jwt, {
//   secret: process.env.JWT_SECRET || 'sua-chave-secreta-do-jwt',
// });

app.register(jwt, {
  secret: 'sua-chave-secreta-do-jwt',
  cookie: {
    cookieName: 'token',
    signed: false, // <- Defina como FALSE se você não está assinando os cookies no login!
  },
});


// Registrar rotas

app.register(authRoutes);
app.register(adminRoutes);
app.register(categoryRoutes);
app.register(productRoutes);
app.register(orderRoutes);
app.register(webhookRoutes);


const start = async () => {
  try {
    // Inicializa o servidor usando a porta e o host dinâmicos do .env
    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`🚀 Servidor executando em http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
import type { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt'; // npm install @fastify/jwt adicionado

import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { registerBodySchema, loginBodySchema } from '../schemas/auth.schema';

import fastifyCookie from '@fastify/cookie';


export async function authRoutes(app: FastifyInstance) {
  
  // 1. ROTA DE CADASTRO (REGISTER)
  app.post('/register', async (request, reply) => {
    try {
      const { name, email, password, phone } = registerBodySchema.parse(request.body);

      // Verifica se o e-mail já está cadastrado
      const userExists = await prisma.user.findUnique({ where: { email } });
      if (userExists) {
        return reply.status(400).send({ message: 'Este e-mail já está em uso.' });
      }

      // Gera o hash seguro da senha (salt = 10)
      const hashedPassword = await bcrypt.hash(password, 10);

      // Salva no MariaDB
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone: phone ?? null,
        },
      });

      return reply.status(201).send({ 
        message: 'Usuário registrado com sucesso!',
        userId: newUser.id 
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Dados inválidos', details: error.errors });
      }
      app.log.error(error);
      return reply.status(500).send({ error: 'Erro ao registrar usuário.' });
    }
  });




  
  // 2. ROTA DE LOGIN (GERAÇÃO DO JWT)
  app.post('/login', async (request, reply) => {
    try {
      const { email, password } = loginBodySchema.parse(request.body);

      // Busca o usuário trazendo todos os campos nativos do schema
      const user = await prisma.user.findUnique({ where: { email } });

      // // console.log("🔍 USUÁRIO DO BANCO NO LOGIN:", { email: user?.email, role_no_banco: user?.role });
      if (!user) {
        return reply.status(400).send({ message: 'E-mail ou senha incorretos.' });
      }

      // Compara a senha enviada com o hash salvo no banco
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return reply.status(400).send({ message: 'E-mail ou senha incorretos.' });
      }

      // Garante que estamos pegando o papel real vindo da coluna do banco de dados
      const token = app.jwt.sign(
        { 
          name: user.name,
          role: user.role || 'CUSTOMER' // <-- Aqui ele vai ler 'ADMIN' ou 'CUSTOMER' direto do MariaDB
        }, 
        { sub: user.id, expiresIn: '7d' }
      );

      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          }
      };
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return reply.status(400).send({ error: 'Dados inválidos', details: error.errors });
      }
      app.log.error(error);
      return reply.status(500).send({ error: 'Erro ao realizar login.' });
    }
  });





// --- LOGIN DO ADMINISTRADOR (Exclusivo para Painel - Cookie HttpOnly) ---
  app.post('/admin/login', async (request, reply) => {
    const { email, password } = request.body as any;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return reply.status(400).send({ message: 'E-mail ou senha incorretos.' });
    }

    // 🔒 BARREIRA ADICIONAL: Bloqueia imediatamente usuários comuns de fazerem login no Admin
    if (user.role !== 'ADMIN') {
      return reply.status(403).send({
        error: 'Acesso negado',
        message: 'Esta área é exclusiva para administradores do sistema.'
      });
    }

    // (Valide a senha aqui futuramente)

    const token = app.jwt.sign(
      { name: user.name, role: 'ADMIN' },
      { sub: user.id, expiresIn: '7d' }
    );

    // Envia o token de forma extremamente segura encapsulado no Cookie
    return reply
      .setCookie('token', token, {
        path: '/',            // Válido para todo o domínio da API
        httpOnly: true,       // Impede leitura via script JavaScript (Imune a XSS)
        secure: process.env.NODE_ENV === 'production', // Apenas via HTTPS em produção
        sameSite: 'strict',   // Previne ataques CSRF
        maxAge: 60 * 60 * 24 * 7, // Mantém logado por 7 dias (em segundos)
      })
      .send({
        message: 'Autenticação administrativa realizada com sucesso.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: 'ADMIN'
        }
      });
  });

  // --- ROTA DE LOGOUT DO ADMIN (Limpa o Cookie) ---
  app.post('/admin/logout', async (request, reply) => {
    return reply
      .clearCookie('token', { path: '/' })
      .send({ message: 'Sessão encerrada.' });
  });
}
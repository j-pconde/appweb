import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3333', // URL do seu backend Fastify
  withCredentials: true,             // Envia e recebe os Cookies HttpOnly automaticamente
  headers: {
    'Content-Type': 'application/json',
  },
});
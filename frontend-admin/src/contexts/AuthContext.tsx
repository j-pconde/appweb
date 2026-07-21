import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

// Definição do formato do usuário do painel
interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  loginAdmin: (email: string, password: string) => Promise<void>;
  logoutAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Verifica se o Administrador já tem um Cookie de sessão válido ao carregar a página
  useEffect(() => {
    async function checkSession() {
      try {
        // Rota do backend para validar o cookie e retornar os dados do perfil logado
        const response = await api.get('/admin/me'); 
        setUser(response.data.user);
      } catch {
        // Se o cookie expirou ou é inválido, limpa o estado silenciosamente
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  // Função para realizar o login administrativo
  const loginAdmin = async (email: string, password: string) => {
    try {
      const response = await api.post('/admin/login', { email, password });
      
      // Armazenamos as informações públicas do usuário no estado
      // (O Cookie 'token' foi gravado automaticamente no navegador pelo Fastify)
      setUser(response.data.user); 
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Falha na autenticação. Verifique suas credenciais.'
      );
    }
  };

  // Função para deslogar e limpar a sessão
  const logoutAdmin = async () => {
    try {
      // Opcional: Rota no backend para limpar/destruir o cookie ('/admin/logout')
      await api.post('/admin/logout');
    } catch {
      // Ignora erro se a rota de logout falhar e limpa o estado local de qualquer forma
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated: !!user, 
        loading, 
        loginAdmin, 
        logoutAdmin 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado para facilitar o uso do contexto nas nossas telas
export const useAuth = () => useContext(AuthContext);
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, loading } = useAuth();

  // 1. Enquanto o backend valida se o Cookie HttpOnly ainda é válido, 
  // mostramos uma tela de carregamento para evitar flashes de conteúdo.
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-100">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-zinc-400">Verificando sessão...</p>
      </div>
    );
  }

  // 2. Se a validação acabou e o usuário NÃO está autenticado, 
  // redirecionamos ele imediatamente para a página de login.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 3. Se estiver tudo certo, renderiza a página protegida que o usuário tentou acessar.
  return <>{children}</>;
}
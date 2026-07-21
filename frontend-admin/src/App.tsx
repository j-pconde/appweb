import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthGuard } from './components/AuthGuard';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';

// Um esqueleto temporário do Dashboard para testarmos o redirecionamento pós-login


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rota pública: Tela de Login */}
          <Route path="/login" element={<Login />} />

          {/* Rota protegida: Só acessa se passar pelo AuthGuard */}
          <Route 
            path="/dashboard" 
            element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            } 
          />

          {/* Qualquer rota desconhecida joga o usuário para o Dashboard (que vai avaliar se ele está logado) */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Sub-componente para Input
const InputField = ({ 
  label, type, id, name, placeholder, value, onChange, disabled, showPasswordToggle, isPasswordVisible, onTogglePassword 
}: any) => (
  <div className="relative">
    <label htmlFor={id} className="block text-[10px] font-bold uppercase tracking-widest text-brand-text-muted mb-1.5">
      {label}
    </label>
    <div className="relative">
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={name === 'password' ? 'current-password' : 'email'}
        disabled={disabled}
        value={value}
        onChange={onChange}
        required
        className="appearance-none block w-full px-4 py-3 bg-brand-card border border-brand-neutral placeholder-brand-text-muted/50 text-brand-text rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary transition-all sm:text-sm disabled:opacity-50"
        placeholder={placeholder}
      />
      {showPasswordToggle && (
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text text-xs"
        >
          {isPasswordVisible ? 'Ocultar' : 'Ver'}
        </button>
      )}
    </div>
  </div>
);

export function Login() {
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      await loginAdmin(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Dados de acesso incorretos.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">

      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-112.5 h-112.5 bg-brand-neutral/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-62.5 h-62.5 bg-brand-neutral/50 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-md w-full space-y-8 bg-brand-card p-10 rounded-2xl border border-brand-neutral shadow-[0_8px_30px_rgba(0,0,0,0.06)] z-10">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-brand-neutral flex items-center justify-center text-brand-text font-light text-xl tracking-wider border border-brand-neutral/40">
            P
          </div>
          <h2 className="mt-6 text-2xl font-light tracking-widest text-brand-text uppercase font-heading">
            PISCALLO
          </h2>
          <p className="mt-1.5 text-xs text-brand-text-muted tracking-wider uppercase">
            Acessar Sistema
          </p>
        </div>

        {error && (
          <div 
            role="alert" 
            aria-live="assertive"
            className="p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-center font-medium"
          >
            {error}
          </div>
        )}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            <InputField
              label="E-mail"
              id="email-address"
              name="email"
              type="email"
              placeholder="nome@piscallo.com"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
            
            <InputField
              label="Senha"
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              disabled={isSubmitting}
              showPasswordToggle={true}
              isPasswordVisible={showPassword}
              onTogglePassword={() => setShowPassword(!showPassword)}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative w-full flex justify-center items-center py-3.5 px-4 text-xs uppercase tracking-widest font-semibold rounded-xl text-white bg-brand-primary hover:bg-brand-hover transition-all active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed h-12 font-heading"
          >
            {isSubmitting ? (
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              'Entrar no Painel'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
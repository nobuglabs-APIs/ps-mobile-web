import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { login } from '../lib/api';

const LOGO_SRC = (import.meta.env.VITE_LOGO_URL as string) || '/IMG/logo.png';

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState(
    (import.meta.env.VITE_ERP_USERNAME as string) || ''
  );
  const [password, setPassword] = useState(
    (import.meta.env.VITE_ERP_PASSWORD as string) || ''
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    setLoading(true);
    setError('');
    try {
      await login(username.trim(), password);
      onLogin();
    } catch (err: any) {
      setError(err?.message || 'Não foi possível iniciar sessão. Verifique as credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full pl-10 pr-11 py-3 text-sm font-medium rounded-lg border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 bg-white transition-all text-slate-800';

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-4 selection:bg-[#0056d6] selection:text-white">
      <div className="w-full max-w-sm">
        {/* Logo e título */}
        <div className="flex flex-col items-center mb-8">
          <img
            src={LOGO_SRC}
            alt="PS – Comércio e Prestação de Serviços"
            className="w-20 h-20 object-contain"
          />
          <h2 className="mt-5 text-lg font-semibold text-slate-800">Iniciar Sessão</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Utilizador"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputCls}
            />
          </div>

          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Palavra-passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
            {password && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-600">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[#0a1e42] hover:bg-[#0056d6] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors cursor-pointer flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                A autenticar...
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

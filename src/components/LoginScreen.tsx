import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { PSLogo } from './PSLogo';

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('admin@psservicos.ao');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotMsg, setForgotMsg] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin();
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f7fb] flex items-center justify-center p-4 sm:p-6 selection:bg-[#0056d6] selection:text-white">
      {/* Container Principal com Estética Empresarial */}
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl shadow-slate-200/70 border border-slate-200/80 overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Lado Esquerdo: Área Visual Discreta com Azul Profundo e Dourado */}
        <div className="hidden md:flex md:col-span-5 bg-[#0a1e42] p-8 lg:p-10 flex-col justify-between relative overflow-hidden text-white">
          {/* Fundo decorativo sutil com tons da marca */}
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-[#0056d6]/20 blur-2xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-[#d49419]/15 blur-xl pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#d49419] via-[#f59e0b] to-[#0056d6]" />

          {/* Topo: Logo compacto invertido */}
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-xs border border-white/15 text-xs text-slate-200 font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse" />
              Portal de Faturação Segura
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight">
              PS Comércio &amp; Prestação de Serviços
            </h1>
            <div className="h-0.5 w-14 bg-[#d49419] my-4 rounded-full" />
            <p className="text-xs lg:text-sm text-slate-300 leading-relaxed">
              Gestão comercial rigorosa, emissão rápida de faturas e controlo financeiro centralizado em kwanzas (Kz).
            </p>
          </div>

          {/* Destaques Rápidos */}
          <div className="relative z-10 space-y-3 my-6">
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <div className="w-5 h-5 rounded-full bg-[#d49419]/20 border border-[#d49419]/40 flex items-center justify-center text-[#f59e0b] shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>Emissão conforme normas fiscais</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <div className="w-5 h-5 rounded-full bg-[#0056d6]/40 border border-[#0056d6] flex items-center justify-center text-blue-300 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>Impressão e exportação em formato A4</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-200">
              <div className="w-5 h-5 rounded-full bg-[#d49419]/20 border border-[#d49419]/40 flex items-center justify-center text-[#f59e0b] shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>Coordenadas bancárias BAI pré-configuradas</span>
            </div>
          </div>

          {/* Rodapé do lado esquerdo */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#f59e0b]" /> Luanda · Angola
            </span>
            <span>v2.6 Pro</span>
          </div>
        </div>

        {/* Lado Direito: Formulário de Autenticação */}
        <div className="md:col-span-7 p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
          {/* Logótipo PS oficial */}
          <div className="mb-6 flex flex-col items-center md:items-start">
            <PSLogo variant="full" size="md" />
            <div className="mt-4 text-center md:text-left">
              <h2 className="text-xl font-extrabold text-[#0a1e42]">Iniciar Sessão</h2>
              <p className="text-xs text-slate-500 mt-1">
                Introduza as suas credenciais para aceder ao sistema de faturação.
              </p>
            </div>
          </div>

          {/* Formulário de Login */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email / Nome de utilizador */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Email / Nome de utilizador
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="exemplo@psservicos.ao"
                  className="w-full pl-10 pr-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 bg-slate-50/70 transition-all text-slate-800"
                />
              </div>
            </div>

            {/* Palavra-passe */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Palavra-passe
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua palavra-passe"
                  className="w-full pl-10 pr-11 py-2.5 text-sm font-medium rounded-xl border border-slate-200 focus:outline-none focus:border-[#0056d6] focus:ring-2 focus:ring-[#0056d6]/15 bg-slate-50/70 transition-all text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  title={showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Lembrar sessão & Esqueci a palavra-passe */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-600 font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0056d6] border-slate-300 focus:ring-[#0056d6]"
                />
                <span>Lembrar sessão</span>
              </label>

              <button
                type="button"
                onClick={() => setForgotMsg(true)}
                className="font-semibold text-[#0056d6] hover:text-[#0a1e42] hover:underline cursor-pointer"
              >
                Esqueci a palavra-passe
              </button>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#0a1e42] hover:bg-[#0056d6] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 group"
            >
              <span>Entrar</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] group-hover:scale-125 transition-transform" />
            </button>

            {/* Mensagem de recuperação */}
            {forgotMsg && (
              <div className="p-3 bg-blue-50/90 border border-blue-200/80 rounded-xl text-xs text-[#0a1e42] text-center">
                Para redefinir o acesso, por favor contacte a administração em{' '}
                <strong>segundapatricia065@gmail.com</strong>.
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
